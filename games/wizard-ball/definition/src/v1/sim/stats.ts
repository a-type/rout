import type { League, LeagueGameState, PlayerStats } from '../gameTypes.js';
import { last } from '../utils.js';

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

/** Updates if the pitching team has blown a save, or if the current winning and losing pitchers should change. */
export function checkSaveWinLossEligility(
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const battingTeamScore = gameState.teamData[gameState.battingTeam].score;
  const pitchingTeamScore = gameState.teamData[gameState.pitchingTeam].score;
  if (battingTeamScore >= pitchingTeamScore) {
    gameState.saveElligiblePitcherId = null;
    if (
      !gameState.winningPitcherId ||
      league.teamLookup[gameState.pitchingTeam].playerIds.includes(
        gameState.winningPitcherId,
      )
    ) {
      const tied = battingTeamScore === pitchingTeamScore;
      gameState.winningPitcherId = tied
        ? null
        : last(gameState.teamData[gameState.battingTeam].pitchers)!;
      gameState.losingPitcherId = tied
        ? null
        : last(gameState.teamData[gameState.pitchingTeam].pitchers)!;
    }
  }
  return gameState;
}
