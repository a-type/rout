import { GameRound, LongGameError, PlayerColorName } from '@long-game/common';
import { dateTime, db, jsonArrayFrom, userNameSelector } from '@long-game/db';
import { GameStatus } from '@long-game/game-definition';
import { getGameState } from '@long-game/game-state';
import { Hono } from 'hono';
import { Env } from '../../config/ctx.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import games from '@long-game/games';
import { getLatestVersion } from '@long-game/game-definition';
import { GameRandom } from '@long-game/game-definition';
import { Turn } from '@long-game/game-definition';
import { getAuthorizedGameSession } from '../../data/gameSession.js';
import { loggedInMiddleware } from '../../middleware/session.js';
import { events } from '../../services/events.js';

export const gameSessionRouter = new Hono<Env>()
  .get('/', loggedInMiddleware, async (ctx) => {
    const gameSessionId = ctx.get('gameSessionId');
    const session = ctx.get('session');

    // join GameSession->Profile to check ownership
    // before allowing access
    const gameSession = await db
      .selectFrom('GameSession')
      .where('GameSession.id', '=', gameSessionId)
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
              'User.color',
            ])
            .select(userNameSelector)
            .whereRef('gameSessionId', '=', 'GameSession.id'),
        ).as('members'),
      ])
      .executeTakeFirst();

    if (!gameSession) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Game session not found',
      );
    }

    const myMembership = gameSession.members.find(
      (member) => member.id === session.userId,
    );

    if (!myMembership) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Game session not found',
      );
    }

    if (myMembership.status !== 'accepted' && !!gameSession.startedAt) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Game session has not been accepted. Cannot view game in progress.',
      );
    }

    const members = gameSession.members.map((member) => ({
      ...member,
      name: member.name ?? 'Unknown',
      color: member.color ? (member.color as PlayerColorName) : 'gray',
    }));

    if (!gameSession.startedAt) {
      return ctx.json({
        ...gameSession,
        members,
        status: { status: 'pending' },
        localPlayer: {
          id: session.userId,
        },
      });
    }

    const game = await getGameState(gameSession, new Date());
    const status =
      game?.gameDefinition.getStatus({
        globalState: game.globalState,
        rounds: game.previousRounds,
        members,
      }) ??
      ({
        status: 'active',
      } as GameStatus);

    return ctx.json({
      ...gameSession,
      members,
      status,
      localPlayer: {
        id: session.userId,
      },
    });
  })
  .put(
    '/',
    loggedInMiddleware,
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const { gameId } = ctx.req.valid('json');
      const gameSessionId = ctx.get('gameSessionId');

      const gameSession = await db
        .selectFrom('GameSession')
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSession.id', '=', gameSessionId)
        .where('GameSessionMembership.userId', '=', session.userId)
        .select(['gameId', 'startedAt'])
        .executeTakeFirst();

      if (!gameSession) {
        throw new LongGameError(LongGameError.Code.NotFound);
      }

      if (gameId && !!gameSession.startedAt) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Cannot change game type when game is already started.',
        );
      }

      // TODO: more validation

      const updated = await db
        .updateTable('GameSession')
        .set({
          gameId,
        })
        .where('id', '=', gameSessionId)
        .returning(['id', 'gameId'])
        .execute();

      return ctx.json(updated);
    },
  )
  .post('/start', loggedInMiddleware, async (ctx) => {
    const session = ctx.get('session');

    const gameSessionId = ctx.get('gameSessionId');

    const gameSession = await db
      .selectFrom('GameSession')
      .where('GameSession.id', '=', gameSessionId)
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
            .select(userNameSelector)
            .whereRef('gameSessionId', '=', 'GameSession.id'),
        ).as('members'),
      ])
      .executeTakeFirst();

    if (
      !gameSession ||
      !gameSession.members.some((m) => m.id === session.userId)
    ) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Game session not found',
      );
    }

    if (!!gameSession.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session already started',
      );
    }

    const gameModule = games[gameSession.gameId];
    if (!gameModule) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        `Game module not found for game ID ${gameSession.gameId}`,
      );
    }
    const gameDefinition = getLatestVersion(gameModule);

    await db
      .updateTable('GameSession')
      .set({
        startedAt: dateTime(),
        initialState: gameDefinition.getInitialGlobalState({
          // altering the seed here so that the first moves don't receive
          // the same random values as the initial state.
          random: new GameRandom(gameSession.randomSeed + 'INITIAL'),
          members: gameSession.members,
        }),
        gameVersion: gameDefinition.version,
      })
      .where('id', '=', gameSessionId)
      .execute();

    return ctx.json({ success: true });
  })
  .get('/state', loggedInMiddleware, async (ctx) => {
    const session = ctx.get('session');

    const gameSessionId = ctx.get('gameSessionId');

    const gameSession = await getAuthorizedGameSession(
      gameSessionId,
      session.userId,
    );

    if (!gameSession) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Game session not found',
      );
    }

    const game = await getGameState(gameSession, new Date());

    if (!game) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Could not load game state',
      );
    }

    const {
      globalState,
      gameDefinition,
      previousRounds,
      currentRound,
      members,
    } = game;

    // we only show the player queued turn for their
    // own user
    // players should only have 1 turn per round.
    const myTurnThisRound = currentRound.turns.find(
      (turn) => turn.userId === session.userId,
    );
    const playerState = gameDefinition.getPlayerState({
      globalState,
      playerId: session.userId,
      roundIndex: currentRound.roundIndex,
      members,
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
      members,
    });

    const state: GameSessionState = {
      state: playerState,
      rounds: publicHistoricalRounds,
      currentTurn: myTurnThisRound,
      status,
    };

    return ctx.json(state);
  })
  .get('/postGame', loggedInMiddleware, async (ctx) => {
    const session = ctx.get('session');

    const gameSessionId = ctx.get('gameSessionId');

    const gameSession = await getAuthorizedGameSession(
      gameSessionId,
      session.userId,
    );

    if (!gameSession) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Game session not found',
      );
    }

    const game = await getGameState(gameSession, new Date());

    if (!game) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Could not load game state',
      );
    }

    const { globalState, gameDefinition, previousRounds, members } = game;

    // using previousRounds here - otherwise this API could be used
    // to see the current state of the game with current round moves before
    // the round is settled!
    const status = gameDefinition.getStatus({
      globalState,
      rounds: previousRounds,
      members,
    });

    if (status.status !== 'completed') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game is not completed',
      );
    }

    return ctx.json({
      winnerIds: status.winnerIds,
      globalState,
    });
  })
  .post(
    '/submitTurn',
    loggedInMiddleware,
    zValidator(
      'json',
      z.object({
        turn: z.object({
          data: z.any(),
        }),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const gameSessionId = ctx.get('gameSessionId');
      const gameSession = await getAuthorizedGameSession(
        gameSessionId,
        session.userId,
      );
      const { turn } = ctx.req.valid('json');

      if (!gameSession) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'Game session not found',
        );
      }

      const game = await getGameState(gameSession, new Date());

      if (!game) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Could not load game state',
        );
      }

      const {
        globalState,
        gameDefinition,
        currentRound,
        previousRounds,
        members,
      } = game;

      // validate the game status - cannot make moves on an ended game
      const status = gameDefinition.getStatus({
        globalState,
        rounds: previousRounds,
        members,
      });
      if (status.status !== 'active') {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game is not active',
        );
      }

      // based on the current confirmed game state (no current round moves),
      // compute the player's view of the state
      const playerState = gameDefinition.getPlayerState({
        globalState,
        playerId: session.userId,
        roundIndex: currentRound.roundIndex,
        members,
      });

      // then apply these moves to that state and see if they're valid
      const validationMessage = gameDefinition.validateTurn({
        playerState,
        turn: {
          data: null,
          ...turn,
          userId: session.userId,
        },
        members,
        roundIndex: currentRound.roundIndex,
      });

      if (validationMessage) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          validationMessage,
        );
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
            gameSessionId,
            userId: session.userId,
            data: turn.data,
            roundIndex: currentRound.roundIndex,
          })
          .onConflict((bld) => {
            // resolve conflicts on composite primary key by updating
            // turn data to the newly supplied turn
            return bld
              .columns(['gameSessionId', 'userId', 'roundIndex'])
              .doUpdateSet({
                data: turn.data,
              });
          })
          .execute();
      });

      events.sendGameStateUpdate(gameSessionId);

      return ctx.json({ success: true });
    },
  );

interface GameSessionState {
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
}
