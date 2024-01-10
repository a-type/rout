import { GameRound, getRoundTimerange, movesToRounds } from '@long-game/common';
import { GameSession, db } from '@long-game/db';
import { GameDefinition, Move, GameRandom } from '@long-game/game-definition';
import games from '@long-game/games';

export type RequiredGameSession = Pick<
  GameSession,
  'id' | 'gameId' | 'initialState' | 'timezone' | 'randomSeed' | 'gameVersion'
>;

async function loadGameState(gameSession: RequiredGameSession, fromDay: Date) {
  const moves = await db
    .selectFrom('GameMove')
    .where('gameSessionId', '=', gameSession.id)
    .select(['id', 'data', 'userId', 'createdAt'])
    .orderBy('createdAt', 'asc')
    .execute();

  const rounds = movesToRounds(moves, gameSession.timezone);

  // separate out moves from the current round
  const { roundStart: currentRoundStart, roundEnd: currentRoundEnd } =
    getRoundTimerange(new Date(fromDay), gameSession.timezone);

  const game = games[gameSession.gameId];
  if (!game) {
    throw new Error('Game not found');
  }

  const gameDefinition = game.versions.find(
    (g) => g.version === gameSession.gameVersion,
  );

  if (!gameDefinition) {
    throw new Error(
      `No game rules found for version ${gameSession.gameVersion} of game ${gameSession.gameId}`,
    );
  }

  // only apply previous round moves! current round hasn't
  // yet been settled
  const previousRounds = rounds.filter(
    (round) => new Date(round.roundStart) < currentRoundStart,
  );

  const globalState = gameDefinition.getState({
    initialState: gameSession.initialState,
    rounds: previousRounds,
    random: new GameRandom(gameSession.randomSeed),
  });

  return {
    globalState,
    rounds,
    gameDefinition,
    roundStart: currentRoundStart,
    roundEnd: currentRoundEnd,
  };
}

function computeCacheKey(gameSessionId: string, fromDay: Date) {
  return `${fromDay.getFullYear()}-${fromDay.getMonth()}-${fromDay.getDate()}:${gameSessionId}`;
}

const gameCache = new Map<string, ReturnType<typeof loadGameState>>();

export async function getCachedGame(
  gameSession: RequiredGameSession,
  fromDay: Date,
): Promise<null | {
  globalState: any;
  rounds: GameRound<Move<any>>[];
  previousRounds: GameRound<Move<any>>[];
  currentRound: GameRound<Move<any>>;
  gameDefinition: GameDefinition;
  roundStart: Date;
  roundEnd: Date;
}> {
  const cacheKey = computeCacheKey(gameSession.id, fromDay);
  const isCached = gameCache.has(cacheKey);

  if (!isCached) {
    gameCache.set(cacheKey, loadGameState(gameSession, fromDay));
  }

  const cachedData = await gameCache.get(cacheKey)!;

  if (!cachedData) return null;

  const previousRounds = cachedData.rounds.filter(
    (round) => round.roundStart < cachedData.roundStart,
  );
  const currentRound = cachedData.rounds.filter(
    (round) => round.roundStart >= cachedData.roundStart,
  );

  if (currentRound.length > 1) {
    throw new Error('Expected at most one current round');
  }

  return {
    ...cachedData,
    previousRounds,
    currentRound: currentRound[0] ?? {
      moves: [],
      roundNumber: previousRounds.length,
      roundStart: cachedData.roundStart,
      roundEnd: cachedData.roundEnd,
    },
  };
}

/**
 * Removes all cached game states older than the provided date.
 */
export function cleanCache(olderThan: Date) {
  const cutoff = computeCacheKey('', olderThan);
  const keysToDelete = Array.from(gameCache.keys()).filter(
    (key) => key < cutoff,
  );
  keysToDelete.forEach((key) => gameCache.delete(key));
}

export function evictSession(gameSessionId: string, fromDay: Date) {
  const cacheKey = computeCacheKey(gameSessionId, fromDay);
  gameCache.delete(cacheKey);
}
