import type { LeagueGameState, PlayerStats } from '../gameTypes';

export function addToPlayerStats(
  gameState: LeagueGameState,
  playerId: string,
  stats: Partial<PlayerStats>,
): LeagueGameState {
  if (!gameState.playerStats[playerId]) {
    gameState.playerStats[playerId] = {};
  }
  const playerStats = gameState.playerStats[playerId];
  for (const key of Object.keys(stats)) {
    // @ts-expect-error: dynamic key assignment
    playerStats[key] = (playerStats[key] || 0) + (stats[key] || 0);
  }
  return gameState;
}
