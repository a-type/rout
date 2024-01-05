import { router, userProcedure } from './util.js';
import * as zod from 'zod';
import { getRoundTimerange } from '@long-game/common';
import {
  db,
  id,
  jsonArrayFrom,
  compareDates,
  dateTime,
  sql,
} from '@long-game/db';
import { TRPCError } from '@trpc/server';
import { assert } from '@a-type/utils';
import { gameDefinitions } from '@long-game/games';
import { ClientSession, Move } from '@long-game/game-definition';

export const gameSessionsRouter = router({
  /**
   * List all game sessions the player is participating in
   */
  gameSessions: userProcedure.query(async (opts) => {
    return [];
  }),
  gameSession: userProcedure
    .input(
      zod.object({
        id: zod.string(),
      }),
    )
    .query(async ({ ctx, input }): Promise<ClientSession> => {
      const session = ctx.session;
      assert(!!session);

      // join GameSession->Profile to check ownership
      // before allowing access
      const gameSession = await db
        .selectFrom('GameSession')
        .where('GameSession.id', '=', input.id)
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .select([
          'GameSession.id',
          'GameSession.gameId',
          'GameSession.status',
          'GameSession.createdAt',
          'GameSession.updatedAt',
          'GameSession.timezone',
        ])
        .select((eb) => [
          jsonArrayFrom(
            eb
              .selectFrom('GameSessionMembership')
              .innerJoin('User', 'User.id', 'GameSessionMembership.userId')
              .select([
                'GameSessionMembership.id as membershipId',
                'GameSessionMembership.userId as id',
                'GameSessionMembership.status',
                'User.imageUrl',
              ])
              .select(
                sql<string>`COALESCE(User.friendlyName, User.fullName)`.as(
                  'name',
                ),
              )
              .whereRef('gameSessionId', '=', 'GameSession.id'),
          ).as('members'),
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const myMembership = gameSession.members.find(
        (member) => member.id === session.userId,
      );

      if (!myMembership) {
        throw new TRPCError({
          message: 'Not a member of this game session',
          code: 'NOT_FOUND',
        });
      }

      if (
        myMembership.status !== 'accepted' &&
        gameSession.status !== 'pending'
      ) {
        throw new TRPCError({
          message:
            'Game session has not been accepted. Cannot view game in progress.',
          code: 'FORBIDDEN',
        });
      }

      return {
        ...gameSession,
        localPlayer: {
          id: session.userId,
        },
      };
    }),
  gameMemberships: userProcedure.query(async (opts) => {
    const session = opts.ctx.session;
    assert(!!session);

    return db
      .selectFrom('GameSessionMembership')
      .where('userId', '=', session.userId)
      .innerJoin(
        'GameSession',
        'GameSession.id',
        'GameSessionMembership.gameSessionId',
      )
      .select([
        'GameSessionMembership.id',
        'gameSessionId',
        'GameSession.status as gameSessionStatus',
        'GameSessionMembership.status as membershipStatus',
        'GameSession.gameId',
        'GameSessionMembership.createdAt',
      ])
      .execute();
  }),
  createGameSession: userProcedure
    .input(
      zod.object({
        gameId: zod.string(),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const gameDefinition = gameDefinitions[opts.input.gameId];
      if (!gameDefinition) {
        throw new TRPCError({
          message: 'No game rules found',
          code: 'NOT_FOUND',
        });
      }

      const gameSession = await db
        .insertInto('GameSession')
        .values({
          id: id(),
          gameId: opts.input.gameId,
          // TODO: configurable + automatic detection?
          timezone: 'America/New_York',
          initialState: gameDefinition.getInitialGlobalState(),
          status: 'pending',
        })
        .returning(['id', 'gameId', 'createdAt'])
        .executeTakeFirstOrThrow();

      // seed our own membership
      await db
        .insertInto('GameSessionMembership')
        .values({
          id: id(),
          gameSessionId: gameSession.id,
          userId: session.userId,
          inviterId: session.userId,
          status: 'accepted',
        })
        .execute();

      return gameSession;
    }),
  updateGameSession: userProcedure
    .input(
      zod.object({
        id: zod.string(),
        status: zod
          .union([
            zod.literal('pending'),
            zod.literal('active'),
            zod.literal('completed'),
          ])
          .optional(),
        gameId: zod.string().optional(),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const gameSession = await db
        .selectFrom('GameSession')
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSession.id', '=', opts.input.id)
        .where('GameSessionMembership.userId', '=', session.userId)
        .select(['gameId', 'GameSession.status'])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (
        opts.input.gameId &&
        opts.input.gameId !== gameSession.gameId &&
        gameSession.status !== 'pending'
      ) {
        throw new TRPCError({
          message: 'Cannot change game type',
          code: 'BAD_REQUEST',
        });
      }

      if (opts.input.status && opts.input.status === 'pending') {
        throw new TRPCError({
          message: 'Cannot set game session to pending',
          code: 'BAD_REQUEST',
        });
      }

      // TODO: more validation

      const updated = await db
        .updateTable('GameSession')
        .set({
          gameId: opts.input.gameId,
          status: opts.input.status,
        })
        .where('id', '=', opts.input.id)
        .returning(['id', 'gameId', 'status'])
        .execute();

      return updated;
    }),
  createGameInvite: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
        userId: zod.string(),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const gameSession = await db
        .selectFrom('GameSession')
        .where('GameSession.id', '=', opts.input.gameSessionId)
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSessionMembership.userId', '=', session.userId)
        .select([
          'GameSessionMembership.status as membershipStatus',
          'GameSession.status',
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (gameSession.status !== 'pending') {
        throw new TRPCError({
          message: 'Game session is already in progress',
          code: 'BAD_REQUEST',
        });
      }

      if (gameSession.membershipStatus !== 'accepted') {
        throw new TRPCError({
          message: 'You must join this game before inviting new players',
          code: 'FORBIDDEN',
        });
      }

      const friendship = await db
        .selectFrom('FriendshipView')
        .where('userId', '=', session.userId)
        .where('friendId', '=', opts.input.userId)
        .select(['status'])
        .executeTakeFirst();

      if (!friendship || friendship.status !== 'accepted') {
        throw new TRPCError({
          message: 'You can only invite friends to games',
          code: 'FORBIDDEN',
        });
      }

      const existingMembership = await db
        .selectFrom('GameSessionMembership')
        .where('gameSessionId', '=', opts.input.gameSessionId)
        .where('userId', '=', opts.input.userId)
        .select(['id'])
        .executeTakeFirst();

      if (existingMembership) {
        throw new TRPCError({
          message: 'User is already a member of this game',
          code: 'BAD_REQUEST',
        });
      }

      await db
        .insertInto('GameSessionMembership')
        .values({
          id: id(),
          gameSessionId: opts.input.gameSessionId,
          inviterId: session.userId,
          userId: opts.input.userId,
          status: 'pending',
        })
        .execute();

      return true;
    }),
  respondToGameInvite: userProcedure
    .input(
      zod.object({
        id: zod.string(),
        response: zod.union([zod.literal('accepted'), zod.literal('declined')]),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const gameSession = await db
        .selectFrom('GameSession')
        .where('GameSession.id', '=', opts.input.id)
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSessionMembership.userId', '=', session.userId)
        .select(['GameSessionMembership.status as membershipStatus'])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (gameSession.membershipStatus !== 'pending') {
        throw new TRPCError({
          message: 'Invite is no longer pending',
          code: 'BAD_REQUEST',
        });
      }

      await db
        .updateTable('GameSessionMembership')
        .set({
          status: opts.input.response,
          claimedAt: dateTime(),
        })
        .where('gameSessionId', '=', opts.input.id)
        .where('userId', '=', session.userId)
        .execute();

      return true;
    }),
  /**
   * Get the current state of a game session
   */
  gameState: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
      }),
    )
    .query(
      async (
        opts,
      ): Promise<{
        /**
         * The public state available to this client,
         * with queued moves applied
         */
        state: any;
        /**
         * All historical moves for all players
         */
        moves: Move<any>[];
        /**
         * All moves submitted by this player for this round
         */
        queuedMoves: Move<any>[];
      }> => {
        const session = opts.ctx.session;
        assert(!!session);

        const gameSession = await db
          .selectFrom('GameSession')
          .innerJoin(
            'GameSessionMembership',
            'GameSession.id',
            'GameSessionMembership.gameSessionId',
          )
          .where('GameSession.id', '=', opts.input.gameSessionId)
          .where('GameSessionMembership.userId', '=', session.userId)
          .select(['gameId', 'initialState', 'timezone'])
          .executeTakeFirst();

        if (!gameSession) {
          throw new TRPCError({
            message: 'No game session found',
            code: 'NOT_FOUND',
          });
        }

        const moves = await db
          .selectFrom('GameMove')
          .where('gameSessionId', '=', opts.input.gameSessionId)
          .select(['id', 'data', 'userId', 'createdAt'])
          .orderBy('createdAt', 'asc')
          .execute();

        // separate out moves from the current round
        const { roundStart } = getRoundTimerange(
          new Date(),
          gameSession.timezone,
        );
        // we only show the player queued moves for their
        // own user
        const movesThisRound = moves.filter(
          (move) =>
            compareDates(move.createdAt, '>=', roundStart) &&
            move.userId === session.userId,
        );
        const movesPreviousRounds = moves.filter(
          (move) => new Date(move.createdAt) < roundStart,
        );

        const gameDefinition = gameDefinitions[gameSession.gameId];

        if (!gameDefinition) {
          throw new TRPCError({
            message: 'No game rules found',
            code: 'NOT_FOUND',
          });
        }

        const globalState = gameDefinition.getState(
          gameSession.initialState,
          moves,
        );
        const playerStateInitial = gameDefinition.getPlayerState(
          globalState,
          session.userId,
        );
        const playerState = gameDefinition.getProspectivePlayerState(
          playerStateInitial,
          session.userId,
          movesThisRound,
        );
        const historicalMoves = movesPreviousRounds.map(
          gameDefinition.getPublicMove,
        );

        return {
          state: playerState,
          moves: historicalMoves,
          queuedMoves: movesThisRound,
        };
      },
    ),
  /**
   * Submit new moves for this round of a game session.
   * Overwrites any previously submitted moves this round.
   */
  submitMoves: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
        moves: zod.array(
          zod.object({
            id: zod.string(),
            data: zod.unknown(),
          }),
        ),
      }),
    )
    .mutation(async (opts) => {
      // validate access to game session first
      const {
        ctx: { session },
      } = opts;
      // userProcedure should already be doing this.
      assert(!!session);

      // determine round number by bucketing to
      // today's date - each round is 1 day, starting
      // at midnight in the game's timezone.
      const gameSession = await db
        .selectFrom('GameSession')
        .select(['timezone'])
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSession.id', '=', opts.input.gameSessionId)
        .where('GameSessionMembership.userId', '=', session.userId)
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      // calculate 00:00 and 23:59 in the game's timezone
      // for today
      const now = new Date();
      const { roundStart, roundEnd } = getRoundTimerange(
        now,
        gameSession.timezone,
      );

      // in one transaction, delete existing moves from this player
      // in the timerange and insert the provided ones
      await db.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('GameMove')
          .where('gameSessionId', '=', opts.input.gameSessionId)
          .where('userId', '=', session.userId)
          .where('createdAt', '>=', dateTime(roundStart))
          .where('createdAt', '<', dateTime(roundEnd))
          .execute();

        await trx
          .insertInto('GameMove')
          .values(
            opts.input.moves.map((move) => ({
              // provide a new ID - otherwise users could
              // overwrite each other's moves or a move
              // from a previous turn (if constraints change)
              id: id(),
              gameSessionId: opts.input.gameSessionId,
              userId: session.userId,
              data: JSON.stringify(move.data),
            })),
          )
          .execute();
      });
    }),
});
