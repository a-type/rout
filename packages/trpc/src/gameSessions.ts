import { assert } from '@a-type/utils';
import { dateTime, db, id, jsonArrayFrom, sql } from '@long-game/db';
import { getCachedGame } from '@long-game/game-cache';
import {
  ClientSession,
  GameStatus,
  Move,
  GameRandom,
} from '@long-game/game-definition';
import { gameDefinitions } from '@long-game/games';
import { TRPCError } from '@trpc/server';
import * as zod from 'zod';
import { router, userProcedure } from './util.js';

export const gameSessionsRouter = router({
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
          'GameSession.startedAt',
          'GameSession.createdAt',
          'GameSession.updatedAt',
          'GameSession.timezone',
          'GameSession.initialState',
          'GameSession.randomSeed',
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

      if (myMembership.status !== 'accepted' && !!gameSession.startedAt) {
        throw new TRPCError({
          message:
            'Game session has not been accepted. Cannot view game in progress.',
          code: 'FORBIDDEN',
        });
      }

      if (!gameSession.startedAt) {
        return {
          ...gameSession,
          status: { status: 'pending' },
          localPlayer: {
            id: session.userId,
          },
        };
      }

      const game = await getCachedGame(gameSession, new Date());
      const status =
        game?.gameDefinition.getStatus({
          globalState: game.globalState,
          moves: game.movesPreviousRounds,
        }) ??
        ({
          status: 'active',
        } as GameStatus);

      return {
        ...gameSession,
        status,
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
        'GameSession.startedAt as startedAt',
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

      const gameSession = await db
        .insertInto('GameSession')
        .values({
          id: id(),
          gameId: opts.input.gameId,
          // TODO: configurable + automatic detection?
          timezone: 'America/New_York',
          initialState: {},
          randomSeed: id(),
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
        .select(['gameId', 'startedAt'])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (opts.input.gameId && !!gameSession.startedAt) {
        throw new TRPCError({
          message: 'Cannot change game type',
          code: 'BAD_REQUEST',
        });
      }

      // TODO: more validation

      const updated = await db
        .updateTable('GameSession')
        .set({
          gameId: opts.input.gameId,
        })
        .where('id', '=', opts.input.id)
        .returning(['id', 'gameId'])
        .execute();

      return updated;
    }),
  start: userProcedure
    .input(
      zod.object({
        id: zod.string(),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const gameSession = await db
        .selectFrom('GameSession')
        .where('GameSession.id', '=', opts.input.id)
        .select(['gameId', 'startedAt', 'randomSeed'])
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

      if (
        !gameSession ||
        !gameSession.members.some((m) => m.id === session.userId)
      ) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (!!gameSession.startedAt) {
        throw new TRPCError({
          message: 'Game session has already started',
          code: 'BAD_REQUEST',
        });
      }

      const gameDefinition = gameDefinitions[gameSession.gameId];
      if (!gameDefinition) {
        throw new TRPCError({
          message: 'No game rules found',
          code: 'NOT_FOUND',
        });
      }

      await db
        .updateTable('GameSession')
        .set({
          startedAt: dateTime(),
          initialState: gameDefinition.getInitialGlobalState({
            playerIds: gameSession.members.map((m) => m.id),
            // altering the seed here so that the first moves don't receive
            // the same random values as the initial state.
            random: new GameRandom(gameSession.randomSeed + 'INITIAL'),
          }),
        })
        .where('id', '=', opts.input.id)
        .execute();
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
          'GameSession.startedAt',
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      if (!!gameSession.startedAt) {
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
        .select([
          'GameSessionMembership.status as membershipStatus',
          'GameSession.startedAt',
        ])
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

      if (!!gameSession.startedAt) {
        throw new TRPCError({
          message: 'Game session is already in progress',
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
        /**
         * The status of the current game. Completed games
         * cannot accept new moves.
         */
        status: GameStatus;
      }> => {
        const session = opts.ctx.session;
        assert(!!session);

        const gameSession = await getAuthorizedGameSession(
          opts.input.gameSessionId,
          session.userId,
        );

        if (!gameSession) {
          throw new TRPCError({
            message: 'No game session found',
            code: 'NOT_FOUND',
          });
        }

        const game = await getCachedGame(gameSession, new Date());

        if (!game) {
          throw new TRPCError({
            message: 'No game session found',
            code: 'NOT_FOUND',
          });
        }

        const {
          moves,
          globalState,
          gameDefinition,
          movesPreviousRounds,
          movesThisRound,
        } = game;
        // we only show the player queued moves for their
        // own user
        const myMovesThisRound = movesThisRound.filter(
          (move) => move.userId === session.userId,
        );
        const playerStateInitial = gameDefinition.getPlayerState({
          globalState,
          playerId: session.userId,
        });
        const playerState = gameDefinition.getProspectivePlayerState({
          playerState: playerStateInitial,
          prospectiveMoves: movesThisRound,
        });
        const historicalMoves = movesPreviousRounds.map((m) =>
          gameDefinition.getPublicMove({ move: m }),
        );
        const status = gameDefinition.getStatus({
          globalState,
          moves,
        });

        return {
          state: playerState,
          moves: historicalMoves,
          queuedMoves: myMovesThisRound,
          status,
        };
      },
    ),

  postGame: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
      }),
    )
    .query(async (opts) => {
      // TODO: extract this to reusable code
      const session = opts.ctx.session;
      assert(!!session);

      const gameSession = await getAuthorizedGameSession(
        opts.input.gameSessionId,
        session.userId,
      );

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const game = await getCachedGame(gameSession, new Date());

      if (!game) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const { globalState, gameDefinition, movesPreviousRounds } = game;

      // using movesPreviousRounds here - otherwise this API could be used
      // to see the current state of the game with current round moves before
      // the round is settled!
      const status = gameDefinition.getStatus({
        globalState,
        moves: movesPreviousRounds,
      });

      if (status.status !== 'completed') {
        throw new TRPCError({
          message: 'Game is not completed',
          code: 'BAD_REQUEST',
        });
      }

      return {
        winnerIds: status.winnerIds,
        globalState,
      };
    }),

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
            data: zod.any(),
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

      // validate the moves
      const gameSession = await getAuthorizedGameSession(
        opts.input.gameSessionId,
        session.userId,
      );

      if (!gameSession) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const game = await getCachedGame(gameSession, new Date());

      if (!game) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const {
        globalState,
        gameDefinition,
        movesThisRound,
        movesPreviousRounds,
        roundStart,
        roundEnd,
      } = game;

      const playerStateInitial = gameDefinition.getPlayerState({
        globalState,
        playerId: session.userId,
      });
      const playerState = gameDefinition.getProspectivePlayerState({
        playerState: playerStateInitial,
        prospectiveMoves: movesThisRound,
      });

      const validationMessage = gameDefinition.validateTurn({
        playerState,
        moves: opts.input.moves.map((m) => ({
          ...m,
          data: m.data || null,
          userId: session.userId,
        })),
      });
      if (validationMessage) {
        throw new TRPCError({
          message: `Invalid moves: ${validationMessage}`,
          code: 'BAD_REQUEST',
        });
      }

      // validate the game status
      const status = gameDefinition.getStatus({
        globalState,
        moves: movesPreviousRounds,
      });
      if (status.status !== 'active') {
        throw new TRPCError({
          message: 'Game is not active',
          code: 'BAD_REQUEST',
        });
      }

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

async function getAuthorizedGameSession(gameSessionId: string, userId: string) {
  const gameSession = await db
    .selectFrom('GameSession')
    .innerJoin(
      'GameSessionMembership',
      'GameSession.id',
      'GameSessionMembership.gameSessionId',
    )
    .where('GameSession.id', '=', gameSessionId)
    .where('GameSessionMembership.userId', '=', userId)
    .select([
      'GameSession.id',
      'GameSession.timezone',
      'GameSession.initialState',
      'GameSession.gameId',
      'GameSession.randomSeed',
    ])
    .executeTakeFirst();

  if (!gameSession) {
    return null;
  }

  return gameSession;
}
