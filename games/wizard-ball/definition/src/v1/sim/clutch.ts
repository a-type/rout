import type { LeagueGameState } from '../gameTypes';
import { getInningInfo } from '../utils';

/** Return a number between 0 and 1 based on situation (increases for fuller counts, more runners in scoring position, late in the game, close score) */

export function determineClutchFactor(gameState: LeagueGameState): number {
  const {
    pitchingTeam,
    battingTeam,
    teamData,
    currentInning,
    bases,
    balls,
    strikes,
  } = gameState;
  // Count fullness: 0.0 (0-0) to 1.0 (3-2)
  const countFullness = (balls + strikes) / 5;

  const runnerOnThird = bases[3] !== null ? 1 : 0;
  const runnerOnSecond = bases[2] !== null ? 1 : 0;

  // Late in the game: 0 (early), 1 (half-inning 17+ which is 9th inning or later)
  // currentInning is 0-based and each full inning is 2 half-innings
  const fullInning = getInningInfo(currentInning).inning;
  const lateGame = Math.min(1, (fullInning - 7) / 2);

  // Close score: 1 if tied, 0 if 5+ run difference
  const scoreDiff = Math.abs(
    teamData[pitchingTeam].score - teamData[battingTeam].score,
  );
  const closeScore = Math.max(0, 1 - scoreDiff / 5);

  // Weighted average (tweak weights as needed)
  const clutch =
    0.25 * countFullness +
    0.15 * runnerOnThird +
    0.1 * runnerOnSecond +
    0.25 * lateGame +
    0.25 * closeScore;

  return Math.max(0, Math.min(1, clutch));
}
