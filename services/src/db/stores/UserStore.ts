import {
  LongGameError,
  PlayerColorName,
  PrefixedId,
  id,
} from '@long-game/common';
import { RpcTarget } from 'cloudflare:workers';
import { DB, jsonObjectFrom, sql } from '../kysely/index.js';

export class UserStore extends RpcTarget {
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

  #fillUserDefaults = <TU extends { id: PrefixedId<'u'> }>(
    user: TU,
  ): TU & {
    color: PlayerColorName;
    displayName: string;
    imageUrl: string | null;
  } => {
    return {
      color: 'gray',
      displayName: 'Anonymous',
      imageUrl: null,
      ...user,
    };
  };

  async getMe() {
    const user = await this.#db
      .selectFrom('User')
      .where('id', '=', this.#userId)
      .select(['id', 'color', 'imageUrl', 'displayName', 'email'])
      .executeTakeFirst();

    if (!user) {
      throw new LongGameError(LongGameError.Code.NotFound, 'User not found');
    }

    return this.#fillUserDefaults(user);
  }

  /**
   * Gets user info. If the logged in user is friends with
   * this person, their full info will be returned. Otherwise,
   * anonymized info will be returned.
   */
  async getUser(id: PrefixedId<'u'>) {
    if (id === this.#userId) {
      return this.getMe();
    }

    const user = await this.#db
      .selectFrom('User')
      .innerJoin('Friendship', 'User.id', 'Friendship.userId')
      .where('User.id', '=', id)
      .where((eb) =>
        eb.or([
          eb('Friendship.userId', '=', this.#userId),
          eb('Friendship.friendId', '=', this.#userId),
        ]),
      )
      .select(['User.id', 'User.color', 'User.imageUrl', 'User.displayName'])
      .executeTakeFirst();

    return this.#fillUserDefaults({
      id,
      ...user,
    });
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
    const result = await this.#db
      .selectFrom('Friendship')
      .where((eb) =>
        eb.or([
          eb('userId', '=', this.#userId),
          eb('friendId', '=', this.#userId),
        ]),
      )
      .select([
        'Friendship.id',
        'Friendship.createdAt',
        'Friendship.updatedAt',
        (eb) =>
          jsonObjectFrom(
            eb
              .selectFrom('User')
              .where((eb) =>
                eb.or([
                  eb('User.id', '=', eb.ref('Friendship.userId')),
                  eb('User.id', '=', eb.ref('Friendship.friendId')),
                ]),
              )
              .where('User.id', '!=', this.#userId)
              .select([
                'User.id',
                'User.color',
                'User.imageUrl',
                'User.displayName',
              ]),
          ).as('friend'),
      ])
      .execute();

    function nonNullFilter<T>(v: T): v is NonNullable<T> {
      return v !== null;
    }
    return result.map((r) => r.friend).filter(nonNullFilter);
  }

  /**
   * Incoming invites for this user
   */
  async getFriendshipInvites({
    direction,
  }: {
    direction: 'incoming' | 'outgoing';
  }) {
    const builder = this.#db
      .selectFrom('FriendshipInvitation')
      .select([
        'id',
        'status',
        'email',
        direction === 'incoming'
          ? (eb) =>
              jsonObjectFrom(
                eb
                  .selectFrom('User')
                  .select([
                    'User.id',
                    'User.color',
                    'User.imageUrl',
                    'User.displayName',
                  ])
                  .whereRef('User.id', '=', 'FriendshipInvitation.inviterId'),
              ).as('otherUser')
          : sql<null>`NULL`.as('otherUser'),
      ])
      .where('status', '=', 'pending');
    if (direction === 'outgoing') {
      return builder.where('inviterId', '=', this.#userId).execute();
    } else {
      const { email } = await this.#db
        .selectFrom('User')
        .where('id', '=', this.#userId)
        .select('email')
        .executeTakeFirstOrThrow();
      return builder.where('email', '=', email).execute();
    }
  }

  async insertFriendshipInvite(invitedEmail: string) {
    const friendship = await this.#db
      .insertInto('FriendshipInvitation')
      .values({
        id: id('fi'),
        inviterId: this.#userId,
        status: 'pending',
        email: invitedEmail,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      })
      .returning('id')
      .onConflict((b) => b.columns(['inviterId', 'email']).doNothing())
      .executeTakeFirstOrThrow();

    return friendship;
  }

  async respondToFriendshipInvite(
    friendshipId: PrefixedId<'fi'>,
    status: 'accepted' | 'declined' | 'retracted',
  ) {
    const friendship = await this.#db
      .selectFrom('FriendshipInvitation')
      .where('FriendshipInvitation.id', '=', friendshipId)
      .select([
        'FriendshipInvitation.status',
        'FriendshipInvitation.inviterId',
        'FriendshipInvitation.email',
        'FriendshipInvitation.expiresAt',
      ])
      .innerJoin('User', 'FriendshipInvitation.email', 'User.email')
      .where('User.id', '=', this.#userId)
      .executeTakeFirstOrThrow(
        () =>
          new LongGameError(
            LongGameError.Code.NotFound,
            'Friendship Invite not found',
          ),
      );

    if (friendship.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Friendship is not pending',
      );
    }

    if (new Date(friendship.expiresAt) < new Date()) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Friendship invite has expired',
      );
    }

    if (status === 'retracted') {
      // deletes the invite -- but only if it was created by the user
      if (friendship.inviterId !== this.#userId) {
        throw new LongGameError(
          LongGameError.Code.Forbidden,
          'You cannot retract this invite',
        );
      }
      await this.#db
        .deleteFrom('FriendshipInvitation')
        .where('id', '=', friendshipId)
        .executeTakeFirstOrThrow();
      return;
    }

    const updated = await this.#db
      .updateTable('FriendshipInvitation')
      .set({ status })
      .where('id', '=', friendshipId)
      .returningAll()
      .execute();

    if (status === 'accepted') {
      const [userId, friendId] = [this.#userId, friendship.inviterId].sort();
      await this.#db
        .insertInto('Friendship')
        .values({
          id: id('f'),
          userId,
          friendId,
          initiatorId: friendship.inviterId,
        })
        .onConflict((b) => b.columns(['userId', 'friendId']).doNothing())
        .execute();
    }

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
        role: 'player',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return membership;
  }

  // just base64 encoded. CF workers don't have Node stuff so
  #encodeCursor = (val: string) => btoa(val);
  #decodeCursor = (val: string) => atob(val);

  async getGameSessions(
    filter: {
      status?: 'pending' | 'accepted' | 'declined' | 'expired';
      first?: number;
      after?: string;
    } = {
      first: 10,
    },
  ) {
    let builder = this.#db
      .selectFrom('GameSessionInvitation')
      .where('GameSessionInvitation.userId', '=', this.#userId)
      .select([
        'GameSessionInvitation.gameSessionId',
        'GameSessionInvitation.status',
        'GameSessionInvitation.createdAt',
      ])
      .orderBy('GameSessionInvitation.createdAt', 'desc');

    if (filter.status) {
      builder = builder.where(
        'GameSessionInvitation.status',
        '=',
        filter.status,
      );
    }

    if (filter.first) {
      builder = builder.limit(filter.first + 1);
    }

    if (filter.after) {
      const cursor = this.#decodeCursor(filter.after);
      builder = builder.where('GameSessionInvitation.createdAt', '>', cursor);
    }

    const results = await builder.execute();
    const hasNextPage = Boolean(filter.first && results.length > filter.first);
    if (hasNextPage) {
      // toss out sentinel value
      results.pop();
    }

    const endCursor = results[results.length - 1]?.createdAt ?? null;
    return {
      results,
      pageInfo: {
        hasNextPage,
        endCursor: endCursor ? this.#encodeCursor(endCursor) : null,
      },
    };
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
      .select(['User.id', 'User.color', 'User.displayName', 'User.imageUrl'])
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
        role: 'player',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
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
