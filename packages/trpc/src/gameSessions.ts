import { assert } from '@a-type/utils';
import { dateTime, db, id, jsonArrayFrom, sql } from '@long-game/db';
import { getGameState } from '@long-game/game-state';
import {
  ClientSession,
  GameStatus,
  Turn,
  GameRandom,
  getLatestVersion,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { TRPCError } from '@trpc/server';
import * as zod from 'zod';
import { router, userProcedure } from './util.js';
import { GameRound } from '@long-game/common';

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
          'GameSession.gameVersion',
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

      const game = await getGameState(gameSession, new Date());
      const status =
        game?.gameDefinition.getStatus({
          globalState: game.globalState,
          rounds: game.previousRounds,
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

      const game = games[opts.input.gameId];

      if (!game) {
        throw new TRPCError({
          message: 'No game found',
          code: 'NOT_FOUND',
        });
      }

      const gameSession = await db
        .insertInto('GameSession')
        .values({
          id: id(),
          gameId: opts.input.gameId,
          gameVersion: getLatestVersion(game).version,
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

      const gameModule = games[gameSession.gameId];
      if (!gameModule) {
        throw new TRPCError({
          message: 'No game rules found',
          code: 'NOT_FOUND',
        });
      }
      const gameDefinition = getLatestVersion(gameModule);

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
          gameVersion: gameDefinition.version,
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
        rounds: GameRound<Turn<any>>[];
        /**
         * The turn submitted by this player for this round.
         * Undefined if player has not yet submitted a turn.
         */
        currentTurn: Turn<any> | undefined;
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

        const game = await getGameState(gameSession, new Date());

        if (!game) {
          throw new TRPCError({
            message: 'No game session found',
            code: 'NOT_FOUND',
          });
        }

        const { globalState, gameDefinition, previousRounds, currentRound } =
          game;
        // we only show the player queued turn for their
        // own user
        // players should only have 1 turn per round.
        const myTurnThisRound = currentRound.turns.find(
          (turn) => turn.userId === session.userId,
        );
        const playerState = gameDefinition.getPlayerState({
          globalState,
          playerId: session.userId,
        });
        const publicHistoricalRounds = previousRounds.map((r) => ({
          ...r,
          turns: r.turns.map((m) =>
            gameDefinition.getPublicTurn({ turn: m, globalState }),
          ),
        }));
        const status = gameDefinition.getStatus({
          globalState,
          rounds: previousRounds,
        });

        return {
          state: playerState,
          rounds: publicHistoricalRounds,
          currentTurn: myTurnThisRound,
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

      const game = await getGameState(gameSession, new Date());

      if (!game) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const { globalState, gameDefinition, previousRounds } = game;

      // using previousRounds here - otherwise this API could be used
      // to see the current state of the game with current round moves before
      // the round is settled!
      const status = gameDefinition.getStatus({
        globalState,
        rounds: previousRounds,
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
  submitTurn: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
        turn: zod.object({
          data: zod.any(),
        }),
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

      const game = await getGameState(gameSession, new Date());

      if (!game) {
        throw new TRPCError({
          message: 'No game session found',
          code: 'NOT_FOUND',
        });
      }

      const { globalState, gameDefinition, currentRound, previousRounds } =
        game;

      // validate the game status - cannot make moves on an ended game
      const status = gameDefinition.getStatus({
        globalState,
        rounds: previousRounds,
      });
      if (status.status !== 'active') {
        throw new TRPCError({
          message: 'Game is not active',
          code: 'BAD_REQUEST',
        });
      }

      // based on the current confirmed game state (no current round moves),
      // compute the player's view of the state
      const playerState = gameDefinition.getPlayerState({
        globalState,
        playerId: session.userId,
      });

      // then apply these moves to that state and see if they're valid
      const validationMessage = gameDefinition.validateTurn({
        playerState,
        turn: {
          data: null,
          ...opts.input.turn,
          userId: session.userId,
        },
      });
      if (validationMessage) {
        throw new TRPCError({
          message: `Invalid moves: ${validationMessage}`,
          code: 'BAD_REQUEST',
        });
      }

      // in one transaction, delete existing moves from this player
      // in the timerange and insert the provided ones
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto('GameTurn')
          .values({
            // provide a new ID - otherwise users could
            // overwrite each other's moves or a move
            // from a previous turn (if constraints change)
            gameSessionId: opts.input.gameSessionId,
            userId: session.userId,
            data: opts.input.turn.data,
            roundIndex: currentRound.roundIndex,
          })
          .onConflict((bld) => {
            // resolve conflicts on composite primary key by updating
            // turn data to the newly supplied turn
            return bld
              .columns(['gameSessionId', 'userId', 'roundIndex'])
              .doUpdateSet({
                data: opts.input.turn.data,
              });
          })
          .execute();
      });

      opts.ctx.events.sendGameStateUpdate(opts.input.gameSessionId);
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
      'GameSession.gameVersion',
      'GameSession.startedAt',
    ])
    .executeTakeFirst();

  if (!gameSession) {
    return null;
  }

  return gameSession;
}
