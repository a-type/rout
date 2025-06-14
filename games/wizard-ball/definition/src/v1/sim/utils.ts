import { GameRandom } from '@long-game/game-definition';
import type {
  HitArea,
  HitTable,
  HitType,
  LeagueGameState,
  LogsPitchData,
  PositionChart,
} from '../gameTypes';
import { last } from '../utils';
import { ActualPitch } from '../pitchData';

export function randomByWeight<T>(
  random: GameRandom,
  weights: Array<{ value: T; weight: number }>,
): T {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const randomValue = random.float(0, totalWeight);
  let cumulativeWeight = 0;
  for (const { value, weight } of weights) {
    cumulativeWeight += weight;
    if (randomValue < cumulativeWeight) {
      return value;
    }
  }
  return weights[weights.length - 1].value; // Fallback
}
export function resetCount(gameState: LeagueGameState): LeagueGameState {
  gameState.balls = 0;
  gameState.strikes = 0;
  return gameState;
}
export function resetBases(gameState: LeagueGameState): LeagueGameState {
  gameState.bases[1] = null;
  gameState.bases[2] = null;
  gameState.bases[3] = null;
  return gameState;
}
export function incrementBatterIndex(
  gameState: LeagueGameState,
  teamId: string,
): LeagueGameState {
  gameState.currentBatterIndex[teamId] += 1;
  gameState.currentBatterIndex[teamId] %=
    gameState.teamData[teamId].battingOrder.length;
  return gameState;
}

export function getCurrentBatter(gameState: LeagueGameState): string {
  return gameState.teamData[gameState.battingTeam].battingOrder[
    gameState.currentBatterIndex[gameState.battingTeam]
  ];
}

export function getCurrentPitcher(gameState: LeagueGameState): string {
  return last(gameState.teamData[gameState.pitchingTeam].pitchers)!;
}
export function multiplyHitTables(
  hitTableA: HitTable,
  hitTableB: Partial<HitTable>,
): HitTable {
  const result: HitTable = { ...hitTableA };
  for (const [key, value] of Object.entries(hitTableB)) {
    result[key as keyof HitTable] *= value;
  }
  return result;
}

export function getCountAdvantage(
  balls: number,
  strikes: number,
): 'behind' | 'neutral' | 'ahead' {
  if (balls - strikes >= 2) {
    return 'behind';
  }
  if (strikes === 2 || strikes > balls) {
    return 'ahead';
  }
  return 'neutral';
}

export function determineDefender(
  random: GameRandom,
  hitArea: HitArea,
  hitType: HitType,
): keyof PositionChart {
  switch (hitType) {
    case 'grounder':
    case 'lineDrive':
      switch (hitArea) {
        case 'farLeft':
          return '3b';
        case 'left':
          return random.float() < 0.7 ? 'ss' : '3b';
        case 'center':
          return random.float() < 0.7 ? 'ss' : '2b';
        case 'right':
          return random.float() < 0.7 ? '2b' : '1b';
        case 'farRight':
          return '1b';
      }

    case 'popUp':
      return 'c';

    case 'fly':
      switch (hitArea) {
        case 'farLeft':
          return 'lf';
        case 'left':
          return random.float() < 0.7 ? 'cf' : 'lf';
        case 'center':
          return 'cf';
        case 'right':
          return random.float() < 0.7 ? 'cf' : 'rf';
        case 'farRight':
          return 'rf';
      }
  }
}
export function logsPitchData({
  hitModifierTable,
  ...pd
}: ActualPitch): LogsPitchData {
  return pd;
}
export function endOfInning(gameState: LeagueGameState): LeagueGameState {
  // Switch teams
  const temp = gameState.battingTeam;
  gameState.battingTeam = gameState.pitchingTeam;
  gameState.pitchingTeam = temp;
  gameState.outs = 0;
  gameState = resetCount(gameState);
  gameState = resetBases(gameState);
  gameState.currentInning += 1;
  return gameState;
}
