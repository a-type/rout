import type { LeagueGameState, League, PlayerId } from '../gameTypes';
import { isPitcher, sum, getInningInfo } from '../utils';
import { getModifiedAttributes } from './ratings';
import { runnersOnBases } from './runners';
import { logger } from '../logger';
import { getCurrentPitcher } from './utils';

export function considerSwapPitcher(
  gameState: LeagueGameState,
  league: League,
): PlayerId | null {
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  const injured = !!pitcher.statusIds.injured;
  if (!injured && (gameState.strikes !== 0 || gameState.balls !== 0)) {
    // Don't swap pitchers if the count is not reset
    return null;
  }

  if (!pitcher) {
    throw new Error(`No pitcher found for team ${gameState.pitchingTeam}`);
  }
  if (!injured && pitcher.stamina > 0.2) {
    return null;
  }
  const team = league.teamLookup[gameState.pitchingTeam];
  const alternatePitchers = team.playerIds
    .map((pid) => league.playerLookup[pid])
    .filter(
      (p) =>
        !team.pitchingOrder.includes(p.id) &&
        p.positions.some((pos) => isPitcher(pos)) &&
        p.stamina > 0.3 &&
        !p.statusIds.injured,
    );
  if (alternatePitchers.length === 0) {
    // console.log(`No alternate pitchers available for swap`);
    return null;
  }
  // Sort by overall
  return alternatePitchers.reduce((a, b) => {
    const aOverall = sum(
      ...Object.values(getModifiedAttributes(a.id, league, gameState, [])),
    );
    const bOverall = sum(
      ...Object.values(getModifiedAttributes(b.id, league, gameState, [])),
    );
    if (aOverall > bOverall) {
      return a;
    } else {
      return b;
    }
  }).id;
}
export function swapPitcher(
  gameState: LeagueGameState,
  newPitcherId: PlayerId,
): LeagueGameState {
  const oldPitcherId = getCurrentPitcher(gameState);
  gameState = logger.addToGameLog(
    {
      kind: 'pitcherChange',
      teamId: gameState.pitchingTeam,
      oldPitcherId,
      newPitcherId,
    },
    gameState,
  );
  const team = gameState.teamData[gameState.pitchingTeam];
  team.pitchers.push(newPitcherId);
  team.battingOrder = team.battingOrder.map((pid) =>
    pid === oldPitcherId ? newPitcherId : pid,
  );
  // determine save elligibility
  const rd =
    gameState.teamData[gameState.pitchingTeam].score -
    gameState.teamData[gameState.battingTeam].score;
  const potentialRuns = 2 + runnersOnBases(gameState);
  const inningInfo = getInningInfo(gameState.currentInning);
  const potentiallyLastInning =
    inningInfo.inning >= 9 ||
    (inningInfo.inning === 8 && inningInfo.half === 'bottom');
  if (gameState.saveElligiblePitcherId === oldPitcherId) {
    gameState.saveElligiblePitcherId = null;
  }
  if (
    (rd > 0 && rd <= 3 && (!potentiallyLastInning || gameState.outs === 0)) ||
    rd <= potentialRuns
  ) {
    gameState.saveElligiblePitcherId = newPitcherId;
  }
  return gameState;
}
