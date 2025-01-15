import { AuthAccount, AuthUser, AuthVerificationCode } from '@a-type/auth';
import {
  LongGameError,
  PlayerColorName,
  PrefixedId,
  assertPrefixedId,
  id,
} from '@long-game/common';
import { RpcTarget, WorkerEntrypoint } from 'cloudflare:workers';
import { jsonObjectFrom } from 'kysely/helpers/sqlite';
import { DB, comparePassword, createDb, hashPassword } from './kysely/index.js';

interface Env {
  D1: D1Database;
  STORE: Service<AdminStore>;
}

export class AuthedStore extends RpcTarget {
  #userId: PrefixedId<'u'>;
  #db: DB;

  constructor(userId: PrefixedId<'u'>, db: DB) {
    super();
    this.#userId = userId;
    this.#db = db;
  }

  async getSession() {
    const user = await this.#db
      .selectFrom('User')
      .where('id', '=', this.#userId)
      .select(['id', 'displayName as name'])
      .executeTakeFirst();

    if (!user) return null;

    return user;
  }

  async getMe() {
    const user = await this.#db
      .selectFrom('User')
      .where('id', '=', this.#userId)
      .select(['id', 'color', 'imageUrl', 'displayName', 'email'])
      .executeTakeFirst();

    if (!user) {
      throw new LongGameError(LongGameError.Code.NotFound, 'User not found');
    }

    return {
      ...user,
      color: (user.color === null ? 'gray' : user.color) as PlayerColorName,
    };
  }

  async updateMe({
    displayName,
    color,
    imageUrl,
    sendEmailUpdates,
  }: {
    displayName?: string;
    color?: string | null;
    imageUrl?: string | null;
    sendEmailUpdates?: boolean;
  }) {
    return this.#db
      .updateTable('User')
      .set({
        displayName,
        color,
        imageUrl,
        sendEmailUpdates,
      })
      .where('id', '=', this.#userId)
      .returningAll()
      .execute();
  }

  async acceptTos() {
    await this.#db
      .updateTable('User')
      .set({
        acceptedTosAt: new Date(),
      })
      .where('id', '=', this.#userId)
      .execute();
  }

  /**
   * Confirmed friendships
   */
  async getFriendships() {
    const builder = this.#db
      .selectFrom('Friendship')
      .innerJoin('User', 'Friendship.friendId', 'User.id')
      .where((eb) =>
        eb.or([
          eb('userId', '=', this.#userId),
          eb('friendId', '=', this.#userId),
        ]),
      )
      .where('status', '=', 'accepted')
      .selectAll('User');

    return builder.execute();
  }

  /**
   * Incoming invites for this user
   */
  async getFriendshipInvites({
    direction,
  }: {
    direction: 'incoming' | 'outgoing';
  }) {
    return this.#db
      .selectFrom('Friendship')
      .where((eb) =>
        eb.or([
          eb('friendId', '=', this.#userId),
          eb('userId', '=', this.#userId),
        ]),
      )
      .where('status', 'in', ['pending', 'declined'])
      .where('initiatorId', direction === 'incoming' ? '!=' : '=', this.#userId)
      .select([
        'id',
        'status',
        (eb) =>
          jsonObjectFrom(
            eb
              .selectFrom('User')
              .where((eb) =>
                eb.or([
                  eb(eb.ref('User.id'), '=', eb.ref('Friendship.userId')),
                  eb(eb.ref('User.id'), '=', eb.ref('Friendship.friendId')),
                ]),
              )
              .where('User.id', '!=', this.#userId)
              .select([
                'User.id',
                'User.color',
                'User.imageUrl',
                'User.displayName',
              ]),
          ).as('otherUser'),
      ])
      .execute();
  }

  async sendFriendshipInvite(invitedEmail: string) {
    const invitedUser = await this.#db
      .selectFrom('User')
      .where('email', '=', invitedEmail)
      .selectAll()
      .executeTakeFirst();

    if (!invitedUser) {
      throw new Error('User not found');
    }

    const [userId, friendId] = [this.#userId, invitedUser.id].sort();

    const existing = await this.#db
      .selectFrom('Friendship')
      .where('userId', '=', userId)
      .where('friendId', '=', friendId)
      .select(['status', 'id'])
      .executeTakeFirst();

    if (existing) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Friendship already exists',
      );
    }

    const friendship = await this.#db
      .insertInto('Friendship')
      .values({
        id: id('f'),
        userId,
        friendId,
        status: 'pending',
        initiatorId: this.#userId,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return friendship;
  }

  async respondToFriendshipInvite(
    friendshipId: PrefixedId<'f'>,
    status: 'accepted' | 'declined',
  ) {
    const friendship = await this.#db
      .selectFrom('Friendship')
      .where('id', '=', friendshipId)
      .select(['status', 'userId', 'friendId'])
      .executeTakeFirstOrThrow(
        () =>
          new LongGameError(
            LongGameError.Code.NotFound,
            'Friendship not found',
          ),
      );

    if (![friendship.friendId, friendship.userId].includes(this.#userId)) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'You are not a participant in this friendship',
      );
    }

    if (friendship.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Friendship is not pending',
      );
    }

    const updated = await this.#db
      .updateTable('Friendship')
      .set({ status })
      .where('id', '=', friendshipId)
      .returningAll()
      .execute();

    return updated;
  }

  // game sessions and invites

  async insertFoundingGameMembership(gameSessionId: PrefixedId<'gs'>) {
    // authorization: this must be the first membership inserted
    // for this game session; otherwise this functionality could be
    // abused to join any game session
    const existing = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', gameSessionId)
      .selectAll()
      .execute();

    if (existing.length > 0) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Game session already has members. Ask for an invite.',
      );
    }

    const membership = await this.#db
      .insertInto('GameSessionInvitation')
      .values({
        id: id('gsi'),
        gameSessionId,
        userId: this.#userId,
        inviterId: this.#userId,
        status: 'accepted',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return membership;
  }

  async getGameSessions() {
    return this.#db
      .selectFrom('GameSessionInvitation')
      .where('GameSessionInvitation.userId', '=', this.#userId)
      .select('GameSessionInvitation.gameSessionId')
      .execute();
  }

  /**
   * Returns only the accepted members of a session
   */
  async getGameSessionMembers(gameSessionId: PrefixedId<'gs'>) {
    const users = await this.#db
      .selectFrom('GameSessionInvitation')
      .innerJoin('User', 'GameSessionInvitation.userId', 'User.id')
      .where('gameSessionId', '=', gameSessionId)
      .where('status', '=', 'accepted')
      .selectAll('User')
      .execute();

    return users.map((u) => {
      return {
        ...u,
        color: (u.color === null ? 'gray' : u.color) as PlayerColorName,
      };
    });
  }

  async getGameSessionInvitations(status: 'pending' | 'accepted' | 'declined') {
    return this.#db
      .selectFrom('GameSessionInvitation')
      .where('userId', '=', this.#userId)
      .where('status', '=', status)
      .selectAll()
      .execute();
  }

  async getGameSessionInvitationForSpecificSession(
    sessionId: PrefixedId<'gs'>,
  ) {
    return this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', sessionId)
      .where('userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirst();
  }

  async sendGameSessionInvitation(
    gameSessionId: PrefixedId<'gs'>,
    userId: PrefixedId<'u'>,
  ) {
    const ownMembership = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', gameSessionId)
      .where('userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirst();

    if (!ownMembership) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Only game session members can invite others',
      );
    }

    const invitation = await this.#db
      .insertInto('GameSessionInvitation')
      .values({
        id: id('gsi'),
        gameSessionId: gameSessionId,
        userId,
        status: 'pending',
        inviterId: this.#userId,
      })
      .onConflict((b) => b.columns(['gameSessionId', 'userId']).doNothing())
      .returningAll()
      .executeTakeFirstOrThrow();

    // TODO: send notification / email

    return invitation;
  }

  async respondToGameSessionInvitation(
    inviteId: PrefixedId<'gsi'>,
    response: 'accepted' | 'declined',
  ) {
    const membership = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('id', '=', inviteId)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (membership.userId !== this.#userId) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'You are not the invited user',
      );
    }

    if (membership.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Invite is not pending',
      );
    }

    const updated = await this.#db
      .updateTable('GameSessionInvitation')
      .set({ status: response })
      .where('id', '=', inviteId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return updated;
  }

  /**
   * Unfortunately ambiguously named with `getGameSessionInvitations`,
   * but this one lists invitations to a specific game session
   * the user has access to.
   */
  async getInvitationsToGameSession(gameSessionId: PrefixedId<'gs'>) {
    // check the user's access to this game session
    const membership = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', gameSessionId)
      .where('userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirst();

    if (!membership) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'You are not a member of this game session',
      );
    }

    const value = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', gameSessionId)
      // only return unaccepted invites
      .where('status', 'in', ['pending', 'declined', 'expired'])
      .select([
        'GameSessionInvitation.id',
        'GameSessionInvitation.status',
        'GameSessionInvitation.expiresAt',
        'GameSessionInvitation.inviterId',
        (eb) =>
          jsonObjectFrom(
            eb
              .selectFrom('User')
              .whereRef('User.id', '=', 'GameSessionInvitation.userId')
              .select([
                'User.id',
                'User.color',
                'User.imageUrl',
                'User.email',
                'User.displayName',
              ]),
          ).as('user'),
      ])
      .execute();

    return value.filter((v) => !!v.user);
  }
}

export class PublicStore extends WorkerEntrypoint<Env> {
  #db: DB;

  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);
    this.#db = createDb({ DB: env.D1 });
  }

  async getStoreForUser(userId: PrefixedId<'u'>) {
    return new AuthedStore(userId, this.#db);
  }

  async testRpc() {
    return {
      foo: 'bar',
    };
  }
}

export class AdminStore extends WorkerEntrypoint<Env> {
  #db: DB;

  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);
    this.#db = createDb({ DB: env.D1 });
  }

  async healthCheck() {
    const result = await this.env.D1.prepare(
      'SELECT 1 AS alive;',
    ).first<number>('alive');
    return result === 1;
  }

  async getAccountByProviderAccountId(
    providerName: string,
    providerAccountId: string,
  ) {
    const dbAccount = await this.#db
      .selectFrom('Account')
      .where('provider', '=', providerName)
      .where('providerAccountId', '=', providerAccountId)
      .selectAll()
      .executeTakeFirst();

    if (!dbAccount) {
      return undefined;
    }

    return {
      ...dbAccount,
      expiresAt: dbAccount.accessTokenExpiresAt ?? null,
    };
  }

  async getUserByEmail(email: string) {
    return this.#db
      .selectFrom('User')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }

  async insertAccount({
    expiresAt,
    userId,
    ...account
  }: Omit<AuthAccount, 'id'>) {
    return this.#db
      .insertInto('Account')
      .values({
        id: id('a'),
        accessTokenExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
        userId: userId as PrefixedId<'u'>,
        ...account,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
  }

  async insertUser({
    plaintextPassword,
    friendlyName: __,
    fullName: _,
    ...user
  }: Omit<AuthUser, 'id' | 'password'> & {
    plaintextPassword?: string | null;
  }) {
    const password = plaintextPassword
      ? await hashPassword(plaintextPassword)
      : undefined;
    const userResult = await this.#db
      .insertInto('User')
      .values({
        id: id('u'),
        password,
        displayName: '',
        ...user,
      })
      .returning('id')
      .executeTakeFirst();

    if (!userResult) {
      throw new Error('Failed to insert user');
    }

    return userResult;
  }

  async insertVerificationCode({
    expiresAt,
    ...verificationCode
  }: Omit<AuthVerificationCode, 'id'>) {
    await this.#db
      .insertInto('VerificationCode')
      .values({
        id: id('vc'),
        expiresAt: new Date(expiresAt),
        ...verificationCode,
      })
      .execute();
  }

  async getVerificationCode(email: string, code: string) {
    return this.#db
      .selectFrom('VerificationCode')
      .where('code', '=', code)
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }

  async consumeVerificationCode(id: string) {
    assertPrefixedId(id, 'vc');
    await this.#db
      .deleteFrom('VerificationCode')
      .where('id', '=', id)
      .execute();
  }

  async getUserByEmailAndPassword(email: string, plaintextPassword: string) {
    const user = await this.#db
      .selectFrom('User')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();

    if (!user?.password) {
      return undefined;
    }

    if (!(await comparePassword(plaintextPassword, user.password))) {
      return undefined;
    }

    return user;
  }

  async updateUser(
    id: string,
    {
      plaintextPassword,
      ...user
    }: Partial<Omit<AuthUser, 'id' | 'password' | 'email'>> & {
      plaintextPassword?: string | null;
    },
  ) {
    assertPrefixedId(id, 'u');
    const password = plaintextPassword
      ? await hashPassword(plaintextPassword)
      : undefined;
    await this.#db
      .updateTable('User')
      .set({
        password,
        ...user,
      })
      .where('id', '=', id)
      .execute();
  }
}

// default service API just provides a healthcheck for the database connection
export default class extends WorkerEntrypoint<Env> {
  async fetch() {
    const ok = await this.env.STORE.healthCheck();
    return new Response(ok ? 'OK' : 'NOT OK', {
      status: ok ? 200 : 500,
    });
  }
}
