import {
  genericId,
  id,
  LongGameError,
  MAX_ACTIVE_GAMES_BY_ENTITLEMENT,
  PlayerColorName,
  PrefixedId,
} from '@long-game/common';
import {
  DB,
  jsonObjectFrom,
  NewPushSubscription,
  NotificationSettings,
  sql,
} from '@long-game/kysely';
import { notificationTypes } from '@long-game/notifications';
import { RpcTarget } from 'cloudflare:workers';

export class UserStore extends RpcTarget {
  #userId: PrefixedId<'u'>;
  #db: DB;
  #env;

  constructor(userId: PrefixedId<'u'>, db: DB, env: DbBindings) {
    super();
    this.#userId = userId;
    this.#db = db;
    this.#env = env;
  }

  async getSession() {
    const user = await this.#db
      .selectFrom('User')
      .where('id', '=', this.#userId)
      .select(['id', 'displayName as name', 'isProductAdmin'])
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
      .select([
        'User.id',
        'User.color',
        'User.displayName',
        'User.email',
        'User.subscriptionEntitlements',
        'User.stripeCustomerId',
        'User.isProductAdmin',
        'User.imageUrl',
      ])
      .select((eb) => eb('User.imageUrl', 'is not', null).as('hasAvatar'))
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
      const user = await this.getMe();
      return {
        ...user,
        isFriend: false,
        isMe: true,
      };
    }

    const user = await this.getPublicUserProfile(id);

    const friendship = await this.#db
      .selectFrom('Friendship')
      .where((eb) =>
        eb.or([
          eb('Friendship.userId', '=', this.#userId),
          eb('Friendship.friendId', '=', this.#userId),
        ]),
      )
      .where((eb) =>
        eb.or([
          eb('Friendship.userId', '=', id),
          eb('Friendship.friendId', '=', id),
        ]),
      )
      .selectAll()
      .executeTakeFirst();

    return this.#fillUserDefaults({
      id,
      isFriend: !!friendship,
      isMe: false,
      ...user,
    });
  }

  async getPublicUserProfile(id: PrefixedId<'u'>) {
    const query = this.#db
      .selectFrom('User as u')
      .where('u.id', '=', id)
      .select(['u.id', 'u.displayName', 'u.color', 'u.imageUrl'])
      .select((eb) => eb('u.imageUrl', 'is not', null).as('hasAvatar'));
    const user = await query.executeTakeFirst();
    return user;
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
        notificationSettings: {
          'turn-ready': {
            push: false,
            email: sendEmailUpdates ?? false,
          },
          'friend-invite': {
            push: false,
            email: sendEmailUpdates ?? false,
          },
          'game-invite': {
            push: false,
            email: sendEmailUpdates ?? false,
          },
          'new-game': {
            push: false,
            email: sendEmailUpdates ?? false,
          },
          'game-abandoned': {
            push: false,
            email: sendEmailUpdates ?? false,
          },
        },
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
          eb('Friendship.userId', '=', this.#userId),
          eb('Friendship.friendId', '=', this.#userId),
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
        'FriendshipInvitation.id',
        'FriendshipInvitation.status',
        'FriendshipInvitation.email',
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
      .where('FriendshipInvitation.status', '=', 'pending');
    if (direction === 'outgoing') {
      return builder
        .where('FriendshipInvitation.inviterId', '=', this.#userId)
        .select((eb) =>
          jsonObjectFrom(
            eb
              .selectFrom('User')
              .select(['User.id', 'User.color'])
              .whereRef('User.email', '=', 'FriendshipInvitation.email'),
          ).as('otherUser'),
        )
        .execute();
    } else {
      const { email } = await this.#db
        .selectFrom('User')
        .where('User.id', '=', this.#userId)
        .select('User.email')
        .executeTakeFirstOrThrow();
      return builder.where('FriendshipInvitation.email', '=', email).execute();
    }
  }

  async insertFriendshipInvite({
    email: providedEmail,
    userId,
  }: {
    email?: string;
    userId?: PrefixedId<'u'>;
  }): Promise<
    | {
        created: true;
        invite: { id: PrefixedId<'fi'>; email: string };
      }
    | {
        created: false;
        invite?: { id: PrefixedId<'fi'>; email: string };
      }
  > {
    if (!(providedEmail || userId)) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Either email or userId must be provided',
      );
    }

    const email =
      providedEmail ||
      (
        await this.#db
          .selectFrom('User')
          .where('id', '=', userId!)
          .select('email')
          .executeTakeFirstOrThrow()
      ).email;
    const otherUserId =
      userId ||
      ((
        await this.#db
          .selectFrom('User')
          .where('email', '=', email)
          .select('id')
          .executeTakeFirst()
      )?.id ??
        null);

    if (otherUserId) {
      const ownEmail = (
        await this.#db
          .selectFrom('User')
          .where('id', '=', this.#userId)
          .select('email')
          .executeTakeFirstOrThrow()
      ).email;
      // check for opposite-direction friendship invite -- if one
      // already exists, we can go ahead and make them friends!
      const oppositeInvite = await this.#db
        .selectFrom('FriendshipInvitation')
        .where('FriendshipInvitation.inviterId', '=', otherUserId)
        .where('FriendshipInvitation.email', '=', ownEmail)
        .where('FriendshipInvitation.status', '=', 'pending')
        .selectAll()
        .executeTakeFirst();

      if (oppositeInvite) {
        await this.respondToFriendshipInvite(oppositeInvite.id, 'accepted');
        return {
          created: false,
        };
      }
    }

    const existing = await this.#db
      .selectFrom('FriendshipInvitation')
      .where('inviterId', '=', this.#userId)
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
    if (existing) {
      return {
        created: false,
        invite: existing,
      };
    }

    await this.#db
      .insertInto('FriendshipInvitation')
      .values({
        id: id('fi'),
        inviterId: this.#userId,
        status: 'pending',
        email,
        // invites expire after 30 days
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      })
      .onConflict((b) =>
        b.columns(['inviterId', 'email']).doUpdateSet({
          // refresh expiration on duplicate
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        }),
      )
      .executeTakeFirstOrThrow();

    const friendship = await this.#db
      .selectFrom('FriendshipInvitation')
      .where('FriendshipInvitation.inviterId', '=', this.#userId)
      .where('FriendshipInvitation.email', '=', email)
      .selectAll()
      .executeTakeFirstOrThrow();

    return { created: true, invite: friendship };
  }

  async respondToFriendshipInvite(
    friendshipId: PrefixedId<'fi'>,
    status: 'accepted' | 'declined',
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

  async retractFriendshipInvite(friendshipId: PrefixedId<'fi'>) {
    await this.#db
      .deleteFrom('FriendshipInvitation')
      .where('id', '=', friendshipId)
      .where('inviterId', '=', this.#userId)
      .executeTakeFirstOrThrow();
  }

  // game sessions and invites

  async createGameSession(gameId?: string, gameVersion?: string) {
    const canJoin = await this.canJoinGame();
    if (!canJoin) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'You have reached your active game limit',
      );
    }

    const gameSessionId = id('gs');
    await this.#db
      .insertInto('GameSession')
      .values({
        id: gameSessionId,
        status: 'pending',
        gameId,
        gameVersion,
      })
      .executeTakeFirstOrThrow();

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

    return { id: gameSessionId };
  }

  // just base64 encoded. CF workers don't have Node stuff so
  #encodeCursor = (val: string) => btoa(val);
  #decodeCursor = (val: string) => atob(val);

  async getGameSessions(
    filter: {
      status?: ('pending' | 'active' | 'complete' | 'abandoned')[];
      invitationStatus?: 'pending' | 'accepted' | 'declined' | 'expired';
      first?: number;
      before?: string;
    } = {
      first: 10,
    },
  ) {
    let builder = this.#db
      .selectFrom('GameSessionInvitation')
      .innerJoin(
        'GameSession',
        'GameSessionInvitation.gameSessionId',
        'GameSession.id',
      )
      .where('GameSessionInvitation.userId', '=', this.#userId)
      .select(({ eb, ref }) => [
        'GameSession.id',
        'GameSessionInvitation.id as invitationId',
        'GameSessionInvitation.status as invitationStatus',
        'GameSession.status',
        'GameSession.gameId',
        'GameSession.winnerIdsJson as winnerIds',
        'GameSessionInvitation.createdAt',
        'GameSessionInvitation.inviterId',
        eb(
          'GameSessionInvitation.inviterId',
          '=',
          ref('GameSessionInvitation.userId'),
        ).as('isFoundingMember'),
      ])
      .orderBy('GameSessionInvitation.createdAt', 'desc');

    if (filter.status) {
      builder = builder.where('GameSession.status', 'in', filter.status);
    }
    if (filter.invitationStatus) {
      builder = builder.where(
        'GameSessionInvitation.status',
        '=',
        filter.invitationStatus,
      );
    }

    if (filter.first) {
      builder = builder.limit(filter.first + 1);
    }

    if (filter.before) {
      const cursor = this.#decodeCursor(filter.before);
      builder = builder.where('GameSessionInvitation.createdAt', '<', cursor);
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

  async countActiveGameSessions() {
    const res = await this.#db
      .selectFrom('GameSession')
      .innerJoin(
        'GameSessionInvitation',
        'GameSessionInvitation.gameSessionId',
        'GameSession.id',
      )
      .where('GameSessionInvitation.userId', '=', this.#userId)
      .where('GameSessionInvitation.status', '=', 'accepted')
      .where('GameSession.status', '=', 'active')
      .select(this.#db.fn.count<number>('GameSession.id').as('count'))
      .executeTakeFirstOrThrow();

    return res.count ?? 0;
  }

  /**
   * Returns only the accepted members of a session
   */
  async getGameSessionMembers(gameSessionId: PrefixedId<'gs'>) {
    const users = await this.#db
      .selectFrom('GameSessionInvitation')
      .innerJoin('User', 'GameSessionInvitation.userId', 'User.id')
      .where('gameSessionId', '=', gameSessionId)
      .where((eb) =>
        eb.or([eb('status', '=', 'accepted'), eb('status', '=', 'abandoned')]),
      )
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

  async createGameSessionInvitation(
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

    const inviteId = id('gsi');
    await this.#db
      .insertInto('GameSessionInvitation')
      .values({
        id: inviteId,
        gameSessionId: gameSessionId,
        userId,
        status: 'pending',
        inviterId: this.#userId,
        role: 'player',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      })
      .onConflict((b) => b.columns(['gameSessionId', 'userId']).doNothing())
      .executeTakeFirstOrThrow();

    // because upsert doesn't return data on conflict, need to refetch
    // the invitation
    const invitation = await this.#db
      .selectFrom('GameSessionInvitation')
      .innerJoin('User', 'GameSessionInvitation.userId', 'User.id')
      .where('GameSessionInvitation.id', '=', inviteId)
      .selectAll('GameSessionInvitation')
      .select(['User.id', 'User.displayName', 'User.email'])
      .executeTakeFirstOrThrow();

    return invitation;
  }

  /**
   * Used to 'forget' a game session -- the session state is in Durable Objects,
   * which must be cleared separately, but deleting invitations makes the
   * session effectively inaccessible from the API.
   */
  async deleteAllGameSessionInvitations(gameSessionId: PrefixedId<'gs'>) {
    // make sure user is the founding member
    const ownMembership = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', gameSessionId)
      .where('userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirst();

    if (!ownMembership) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Only game session members can delete invitations',
      );
    }
    if (ownMembership.inviterId !== ownMembership.userId) {
      // this user is not the founding member - founding member is self-invited
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Only the creator of the game session can delete it',
      );
    }

    await this.#db
      .deleteFrom('GameSessionInvitation')
      .where('GameSessionInvitation.gameSessionId', '=', gameSessionId)
      .execute();
  }

  async createGameSessionInvitationLink(gameSessionId: PrefixedId<'gs'>) {
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

    const inviteId = id('gsl');
    await this.#db
      .insertInto('GameSessionInvitationLink')
      .values({
        id: inviteId,
        gameSessionId: gameSessionId,
        code: genericId(),
      })
      .onConflict((b) => b.column('gameSessionId').doNothing())
      .executeTakeFirstOrThrow();

    return inviteId;
  }

  async getGameSessionInvitationLinkCode(gameSessionId: PrefixedId<'gs'>) {
    const query = () =>
      this.#db
        .selectFrom('GameSessionInvitationLink')
        .where('gameSessionId', '=', gameSessionId)
        .select(['code'])
        .executeTakeFirst();

    let result = await query();
    if (!result) {
      await this.createGameSessionInvitationLink(gameSessionId);
      result = await query();
      if (!result) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Failed to create game session invitation link',
        );
      }
    }

    return result.code;
  }

  async claimGameSessionInvitationLink(linkCode: string) {
    const link = await this.#db
      .selectFrom('GameSessionInvitationLink')
      .where('code', '=', linkCode)
      .selectAll()
      .executeTakeFirstOrThrow();

    const existingMembership = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', link.gameSessionId)
      .where('userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirst();

    if (existingMembership) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'You are already a member of this game session',
      );
    }

    // check that game is still pending
    const gameSession = await this.#db
      .selectFrom('GameSession')
      .where('id', '=', link.gameSessionId)
      .select(['status'])
      .executeTakeFirstOrThrow();
    if (gameSession.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot join a game that is already in progress',
      );
    }

    const membership = await this.#db
      .insertInto('GameSessionInvitation')
      .values({
        id: id('gsi'),
        gameSessionId: link.gameSessionId,
        userId: this.#userId,
        status: 'accepted',
        inviterId: this.#userId,
        role: 'player',
        // doesn't matter
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return membership;
  }

  async respondToGameSessionInvitation(
    inviteId: PrefixedId<'gsi'>,
    response: 'accepted' | 'declined',
  ) {
    if (response === 'accepted') {
      const canJoin = await this.canJoinGame();
      if (!canJoin) {
        throw new LongGameError(
          LongGameError.Code.Forbidden,
          'You have reached your active game limit',
        );
      }
    }

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
      console.debug(`Invite ${inviteId} status: ${membership.status}`);
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Invite is not pending',
      );
    }

    // check that game is still pending
    const gameSession = await this.#db
      .selectFrom('GameSession')
      .where('id', '=', membership.gameSessionId)
      .select(['status'])
      .executeTakeFirstOrThrow();
    if (gameSession.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot join a game that is already in progress',
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
   * Updates the user's invitation to 'abandoned' status.
   * Does not remove them from the game state (this must be done
   * on the Durable Object side).
   */
  async abandonGameSession(gameSessionId: PrefixedId<'gs'>) {
    const membership = await this.#db
      .selectFrom('GameSessionInvitation')
      .where('gameSessionId', '=', gameSessionId)
      .where('userId', '=', this.#userId)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (membership.status !== 'accepted') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'You can only abandon accepted game sessions',
      );
    }

    const updated = await this.#db
      .updateTable('GameSessionInvitation')
      .set({ status: 'abandoned' })
      .where('id', '=', membership.id)
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

  async createPushSubscription(data: Omit<NewPushSubscription, 'userId'>) {
    await this.#db
      .insertInto('PushSubscription')
      .values({
        endpoint: data.endpoint,
        userId: this.#userId,
        auth: data.auth,
        p256dh: data.p256dh,
        expirationTime: data.expirationTime,
      })
      .onConflict((cb) =>
        cb.column('endpoint').doUpdateSet({
          auth: data.auth,
          p256dh: data.p256dh,
          userId: this.#userId,
          expirationTime: data.expirationTime,
        }),
      )
      .execute();
  }

  async deletePushSubscription(endpoint: string) {
    await this.#db
      .deleteFrom('PushSubscription')
      .where('endpoint', '=', endpoint)
      .where('userId', '=', this.#userId)
      .executeTakeFirstOrThrow();
  }

  async listPushSubscriptions() {
    return this.#db
      .selectFrom('PushSubscription')
      .where('userId', '=', this.#userId)
      .selectAll()
      .execute();
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const user = await this.#db
      .selectFrom('User')
      .where('User.id', '=', this.#userId)
      .select(['User.notificationSettings'])
      .executeTakeFirstOrThrow();

    const defaults = notificationTypes.reduce((acc, key) => {
      acc[key] = { email: false, push: false };
      return acc;
    }, {} as NotificationSettings);

    return {
      ...defaults,
      ...user.notificationSettings,
    } as NotificationSettings;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    const current = await this.getNotificationSettings();
    const user = await this.#db
      .updateTable('User')
      .set({
        notificationSettings: { ...current, ...settings },
      })
      .where('User.id', '=', this.#userId)
      .returning('User.notificationSettings')
      .executeTakeFirstOrThrow(
        () => new LongGameError(LongGameError.Code.NotFound),
      );
    return user.notificationSettings as NotificationSettings;
  }

  async getNotifications({
    first = 10,
    after,
    status,
  }: {
    first?: number;
    after?: string;
    status?: 'unread' | 'read';
  } = {}) {
    let builder = this.#db
      .selectFrom('Notification')
      .where('Notification.userId', '=', this.#userId)
      .orderBy('Notification.createdAt', 'desc')
      .selectAll('Notification');

    if (after) {
      const cursor = this.#decodeCursor(after);
      builder = builder.where('Notification.createdAt', '<', cursor);
    }

    if (first) {
      builder = builder.limit(first + 1);
    }

    if (status) {
      if (status === 'unread') {
        builder = builder.where('Notification.readAt', 'is', null);
      } else if (status === 'read') {
        builder = builder.where('Notification.readAt', 'is not', null);
      }
    }

    const results = await builder.execute();
    const hasNextPage = Boolean(first && results.length > first);
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

  async markNotificationAsRead(notificationId: PrefixedId<'no'>, read = true) {
    const notification = await this.#db
      .updateTable('Notification')
      .set({
        readAt: read ? new Date() : null,
      })
      .where('Notification.id', '=', notificationId)
      .where('Notification.userId', '=', this.#userId)
      .returningAll()
      .executeTakeFirstOrThrow(
        () =>
          new LongGameError(
            LongGameError.Code.NotFound,
            'Notification not found',
          ),
      );

    return notification;
  }

  async markAllNotificationsAsRead() {
    await this.#db
      .updateTable('Notification')
      .set({
        readAt: new Date(),
      })
      .where('Notification.userId', '=', this.#userId)
      .where('Notification.readAt', 'is', null)
      .execute();
  }

  async deleteNotification(notificationId: PrefixedId<'no'>) {
    await this.#db
      .deleteFrom('Notification')
      .where('Notification.id', '=', notificationId)
      .where('Notification.userId', '=', this.#userId)
      .executeTakeFirstOrThrow(
        () =>
          new LongGameError(
            LongGameError.Code.NotFound,
            'Notification not found',
          ),
      );
  }

  /**
   * Gets all game IDs owned by confirmed members of the game session.
   * These represent the games that can be played in this session.
   */
  async getAvailableGamesForSession(gameSessionId: PrefixedId<'gs'>) {
    const userGames = await this.#db
      .selectFrom('UserGamePurchase')
      .innerJoin(
        'GameSessionInvitation',
        'UserGamePurchase.userId',
        'GameSessionInvitation.userId',
      )
      .innerJoin(
        'GameProductItem',
        'UserGamePurchase.gameProductId',
        'GameProductItem.gameProductId',
      )
      .where('GameSessionInvitation.gameSessionId', '=', gameSessionId)
      .where('GameSessionInvitation.status', '=', 'accepted')
      .select('GameProductItem.gameId')
      .execute();
    return Array.from(new Set(userGames.map((game) => game.gameId)));
  }

  async getOwnedGames() {
    const games = await this.#db
      .selectFrom('UserGamePurchase')
      .innerJoin(
        'GameProduct',
        'UserGamePurchase.gameProductId',
        'GameProduct.id',
      )
      .innerJoin(
        'GameProductItem',
        'GameProduct.id',
        'GameProductItem.gameProductId',
      )
      .where('UserGamePurchase.userId', '=', this.#userId)
      .select(['GameProductItem.gameId'])
      .execute();

    return games.map((game) => game.gameId);
  }

  async getOwnedGameProducts() {
    const products = await this.#db
      .selectFrom('UserGamePurchase')
      .innerJoin(
        'GameProduct',
        'UserGamePurchase.gameProductId',
        'GameProduct.id',
      )
      .where('UserGamePurchase.userId', '=', this.#userId)
      .select(['GameProduct.id'])
      .execute();

    return products.map((product) => product.id);
  }

  async getEntitlements() {
    const user = await this.#db
      .selectFrom('User')
      .where('User.id', '=', this.#userId)
      .select(['User.subscriptionEntitlements'])
      .executeTakeFirstOrThrow();

    return user.subscriptionEntitlements;
  }

  async getRemainingGameSessions() {
    if (this.#env.DEV_MODE) {
      return 100;
    }
    const entitlements = await this.getEntitlements();
    const activeGameCount = await this.countActiveGameSessions();
    const entitlementsToMaxes = Object.entries(entitlements)
      .filter(([_, active]) => active)
      .map(([name]) => MAX_ACTIVE_GAMES_BY_ENTITLEMENT[name] ?? 0);
    const maxActiveGames = Math.max(
      MAX_ACTIVE_GAMES_BY_ENTITLEMENT.FREE,
      ...entitlementsToMaxes,
    );
    return Math.max(0, maxActiveGames - activeGameCount);
  }
  async canJoinGame() {
    return (await this.getRemainingGameSessions()) > 0;
  }
}
