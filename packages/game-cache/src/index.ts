import { getRoundTimerange } from '@long-game/common';
import { GameSession, db } from '@long-game/db';
import { GameDefinition, Move } from '@long-game/game-definition';
import { gameDefinitions } from '@long-game/games';

export type RequiredGameSession = Pick<
  GameSession,
  'id' | 'gameId' | 'initialState' | 'timezone'
>;

async function loadGameState(gameSession: RequiredGameSession, fromDay: Date) {
  const moves = await db
    .selectFrom('GameMove')
    .where('gameSessionId', '=', gameSession.id)
    .select(['id', 'data', 'userId', 'createdAt'])
    .orderBy('createdAt', 'asc')
    .execute();

  // separate out moves from the current round
  const { roundStart, roundEnd } = getRoundTimerange(
    new Date(fromDay),
    gameSession.timezone,
  );

  const gameDefinition = gameDefinitions[gameSession.gameId];

  if (!gameDefinition) {
    throw new Error('No game rules found');
  }

  const globalState = gameDefinition.getState(gameSession.initialState, moves);

  return {
    globalState,
    moves,
    gameDefinition,
    roundStart,
    roundEnd,
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
  moves: Move<any>[];
  movesPreviousRounds: Move<any>[];
  movesThisRound: Move<any>[];
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

  const movesPreviousRounds = cachedData.moves.filter(
    (move) => new Date(move.createdAt) < cachedData.roundStart,
  );
  const movesThisRound = cachedData.moves.filter(
    (move) => new Date(move.createdAt) >= cachedData.roundStart,
  );

  return {
    ...cachedData,
    movesPreviousRounds,
    movesThisRound,
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
