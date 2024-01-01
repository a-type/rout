import { Move } from '@long-game/game-definition';
import { router, userProcedure } from './util.js';
import * as zod from 'zod';
import { Session, getRoundTimerange } from '@long-game/common';
import { db, id } from '@long-game/db';
import { TRPCError } from '@trpc/server';
import { assert } from '@a-type/utils';
import { gameDefinitions } from '@long-game/games';

export const appRouter = router({
  /**
   * List all game sessions the player is participating in
   */
  gameSessions: userProcedure.query(async (opts): Promise<Array<Session>> => {
    return [];
  }),
  gameSession: userProcedure
    .input(
      zod.object({
        id: zod.string(),
      }),
    )
    .query(async ({ ctx, input }): Promise<Session> => {
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
        .where('GameSessionMembership.userId', '=', session.userId)
        .select([
          'GameSession.id as gameSessionId',
          'GameSession.gameId as gameId',
          'GameSessionMembership.userId as userId',
          'GameSessionMembership.status as status',
          'GameSession.createdAt as createdAt',
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (gameSession.status !== 'accepted') {
        throw new TRPCError({
          message: 'Game session has not been accepted',
          code: 'NOT_FOUND',
        });
      }

      return gameSession;
    }),
  gameMemberships: userProcedure.query(async (opts) => {
    const session = opts.ctx.session;
    assert(!!session);

    return db
      .selectFrom('GameSessionMembership')
      .where('userId', '=', session.userId)
      .select(['id', 'gameSessionId', 'inviterId', 'status'])
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
            move.createdAt >= roundStart && move.userId === session.userId,
        );
        const movesPreviousRounds = moves.filter(
          (move) => move.createdAt < roundStart,
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
          .where('createdAt', '>=', roundStart)
          .where('createdAt', '<', roundEnd)
          .execute();

        await trx
          .insertInto('GameMove')
          .values(
            opts.input.moves.map((move) => ({
              id: move.id,
              gameSessionId: opts.input.gameSessionId,
              userId: session.userId,
              data: JSON.stringify(move.data),
            })),
          )
          .execute();
      });
    }),
});
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
