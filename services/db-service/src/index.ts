import { AuthAccount, AuthUser, AuthVerificationCode } from '@a-type/auth';
import { LongGameError } from '@long-game/common';
import {
  DB,
  PrefixedId,
  assertPrefixedId,
  comparePassword,
  createDb,
  hashPassword,
  id,
  jsonArrayFrom,
  userNameSelector,
} from '@long-game/db';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { RpcTarget, WorkerEntrypoint } from 'cloudflare:workers';

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
      .select(['id', userNameSelector])
      .executeTakeFirst();

    if (!user) return null;

    return user as { id: string; name: string };
  }

  async getFriendships(
    filter: {
      status?: 'accepted' | 'pending' | 'declined';
    } = {},
  ) {
    const builder = this.#db
      .selectFrom('Friendship')
      .where((eb) =>
        eb.or([
          eb('userId', '=', this.#userId),
          eb('friendId', '=', this.#userId),
        ]),
      )
      .where('status', '=', 'accepted')
      .selectAll();

    if (filter.status) {
      builder.where('status', '=', filter.status);

      // only show pending where initiator is not current user
      if (filter.status === 'pending') {
        builder.where('initiatorId', '!=', this.#userId);
      }
    }

    return builder.execute();
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

  // game sessions
  async prepareGameSession(input: { gameId: string }) {
    const game = games[input.gameId];
    const gameSession = await this.#db
      .insertInto('GameSession')
      .values({
        id: id('gs'),
        gameId: game.id,
        gameVersion: getLatestVersion(game).version,
        // TODO: configurable / automatic detection
        timezone: 'America/New_York',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const membership = await this.#db
      .insertInto('GameSessionMembership')
      .values({
        id: id('gsm'),
        gameSessionId: gameSession.id,
        userId: this.#userId,
        inviterId: this.#userId,
        status: 'accepted',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      gameSession,
      membership,
    };
  }

  async getGameSession(id: PrefixedId<'gs'>) {
    return this.#db
      .selectFrom('GameSession')
      .innerJoin(
        'GameSessionMembership',
        'GameSession.id',
        'GameSessionMembership.gameSessionId',
      )
      .where('GameSession.id', '=', id)
      .where('GameSessionMembership.userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirst();
  }

  async updateGameSession(input: { id: PrefixedId<'gs'>; gameId: string }) {
    const gameSession = await this.getGameSession(input.id);

    if (!gameSession) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Could not find that game session. Are you logged in?',
      );
    }

    if (input.gameId && !!gameSession.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot change the selected game after it has started',
      );
    }

    const updated = await this.#db
      .updateTable('GameSession')
      .set({
        gameId: input.gameId,
      })
      .where('id', '=', input.id)
      .returningAll()
      .executeTakeFirstOrThrow(
        () =>
          new LongGameError(
            LongGameError.Code.NotFound,
            'Could not find that game session. Are you logged in?',
          ),
      );

    return updated;
  }

  async startGameSession(id: PrefixedId<'gs'>) {
    const gameSession = await this.getGameSession(id);

    if (!gameSession) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Could not find that game session. Are you logged in?',
      );
    }

    const gameModule = games[gameSession.gameId];
    if (!gameModule) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        `Selected game was not found on the server for game ID ${gameSession.id}`,
      );
    }

    const gameDefinition = getLatestVersion(gameModule);

    const updated = await this.#db
      .updateTable('GameSession')
      .set({
        startedAt: new Date(),
        gameVersion: gameDefinition.version,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow(
        () =>
          new LongGameError(
            LongGameError.Code.NotFound,
            'Could not find that game session. Are you logged in?',
          ),
      );

    return updated;
  }

  async getGameSessions() {
    return this.#db
      .selectFrom('GameSession')
      .innerJoin(
        'GameSessionMembership',
        'GameSession.id',
        'GameSessionMembership.gameSessionId',
      )
      .where('GameSessionMembership.userId', '=', this.#userId)
      .selectAll('GameSession')
      .select((eb) => [
        jsonArrayFrom(
          eb
            .selectFrom('GameSessionMembership')
            .selectAll()
            .whereRef('gameSessionId', '=', 'GameSession.id'),
        ).as('memberships'),
      ])
      .execute();
  }

  async getGameSessionMembers(gameSessionId: PrefixedId<'gs'>) {
    return this.#db
      .selectFrom('GameSessionMembership')
      .where('gameSessionId', '=', gameSessionId)
      .selectAll()
      .execute();
  }

  async sendGameSessionInvite(
    gameSessionId: PrefixedId<'gs'>,
    userId: PrefixedId<'u'>,
  ) {
    const gameSession = await this.getGameSession(gameSessionId);
    if (!gameSession) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Could not find that game session. Are you logged in?',
      );
    }

    const membership = await this.#db
      .insertInto('GameSessionMembership')
      .values({
        id: id('gsm'),
        gameSessionId: gameSessionId,
        userId,
        status: 'pending',
        inviterId: this.#userId,
      })
      .onConflict((b) => b.columns(['gameSessionId', 'userId']).doNothing())
      .returningAll()
      .executeTakeFirstOrThrow();

    return membership;
  }

  async respondToGameSessionInvite(
    inviteId: PrefixedId<'gsm'>,
    response: 'accepted' | 'declined',
  ) {
    const membership = await this.#db
      .selectFrom('GameSessionMembership')
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
      .updateTable('GameSessionMembership')
      .set({ status: response })
      .where('id', '=', inviteId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return updated;
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
    fullName,
    friendlyName,
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
        fullName: fullName || 'Anonymous',
        friendlyName: friendlyName || 'Anonymous',
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
