import type { LeagueGameState, League, Base, PlayerId } from '../gameTypes';
import { addToPlayerStats } from './stats';
import { updatePlayerHeat } from './streak';
import { getCurrentPitcher, getCurrentBatter } from './utils';

export function runnersOnBases(gameState: LeagueGameState): number {
  return Object.values(gameState.bases).filter((playerId) => playerId !== null)
    .length;
}
export function advanceRunnerForced(
  gameState: LeagueGameState,
  league: League,
  base: Base,
  sourcePlayerId: PlayerId,
  pitchingPlayerId: PlayerId,
): LeagueGameState {
  if (base < 1 || base > 3) {
    throw new Error('Base must be between 1 and 3');
  }
  const currentPlayerId = gameState.bases[base];
  const pitcherId = getCurrentPitcher(gameState);
  if (currentPlayerId === null) {
    // No one on this base, so we can stop
    return gameState;
  }
  if (base === 3) {
    gameState.bases[base] = null;
    gameState = addToPlayerStats(gameState, sourcePlayerId, {
      runsBattedIn: 1,
    });
    gameState = addToPlayerStats(gameState, currentPlayerId, {
      runs: 1,
    });
    gameState = addToPlayerStats(gameState, pitchingPlayerId, {
      earnedRuns: 1,
    });
    league = updatePlayerHeat('batting', currentPlayerId, league, 'run');
    league = updatePlayerHeat('batting', sourcePlayerId, league, 'rbi');
    league = updatePlayerHeat('pitching', pitcherId, league, 'run');
    gameState.teamData[gameState.battingTeam].score += 1;
    return gameState;
  }
  advanceRunnerForced(
    gameState,
    league,
    (base + 1) as Base,
    sourcePlayerId,
    pitchingPlayerId,
  );
  gameState.bases[(base + 1) as Base] = gameState.bases[base];
  gameState.bases[base] = null;

  return gameState;
}
export function advanceAllRunners(
  gameState: LeagueGameState,
  league: League,
  sourcePlayerId: PlayerId,
  pitchingPlayerId: PlayerId,
  count: number = 1,
): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  if (count > 1) {
    gameState = advanceAllRunners(
      gameState,
      league,
      sourcePlayerId,
      pitchingPlayerId,
      count - 1,
    );
  }
  gameState = advanceRunnerForced(
    gameState,
    league,
    3,
    currentBatter,
    currentPitcher,
  );
  gameState = advanceRunnerForced(
    gameState,
    league,
    2,
    currentBatter,
    currentPitcher,
  );
  gameState = advanceRunnerForced(
    gameState,
    league,
    1,
    currentBatter,
    currentPitcher,
  );
  return gameState;
}
