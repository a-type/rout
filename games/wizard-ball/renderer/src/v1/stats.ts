import {
  GameResult,
  League,
  PlayerId,
  PlayerStats,
} from '@long-game/game-wizard-ball-definition';
import { roundFloat } from './utils';

export type CalculatedStats = {
  battingAverage: string;
  onBasePercentage: string;
  sluggingPercentage: string;
  inningsPitched: string;
  era: string;
  whip: string;
  kPerNine: string;
  bbPerNine: string;
};

export type AllStats = PlayerStats & CalculatedStats;

export type StatInfo = {
  label: string;
  value: keyof (PlayerStats & CalculatedStats);
};

export const battingStats = [
  { label: 'AB', value: 'atBats' },
  { label: 'R', value: 'runs' },
  { label: 'H', value: 'hits' },
  { label: '2B', value: 'doubles' },
  { label: '3B', value: 'triples' },
  { label: 'RBI', value: 'runsBattedIn' },
  { label: 'HR', value: 'homeRuns' },
  { label: 'BB', value: 'walks' },
  { label: 'SO', value: 'strikeouts' },
  { label: 'SB', value: 'stolenBases' },
  { label: 'CS', value: 'caughtStealing' },
  { label: 'AVG', value: 'battingAverage' },
  { label: 'OBP', value: 'onBasePercentage' },
  { label: 'SLG', value: 'sluggingPercentage' },
] as const satisfies Array<StatInfo>;

export const pitchingStats = [
  { label: 'IP', value: 'inningsPitched' },
  { label: 'H', value: 'hitsAllowed' },
  { label: 'ER', value: 'earnedRuns' },
  { label: 'BB', value: 'pWalks' },
  { label: 'K', value: 'ks' },
  { label: 'W', value: 'wins' },
  { label: 'L', value: 'losses' },
  { label: 'HR', value: 'homeRunsAllowed' },
  { label: 'ERA', value: 'era' },
  { label: 'WHIP', value: 'whip' },
  { label: 'K/9', value: 'kPerNine' },
  { label: 'BB/9', value: 'bbPerNine' },
] as const satisfies Array<StatInfo>;

export function calculatePlayerStats(
  gameResults: GameResult[],
  filter: {
    playerIds?: PlayerId[];
    gameIds?: string[];
  } = {},
) {
  const playerStats: Record<PlayerId, PlayerStats> = {};
  gameResults
    .filter((game) => !filter.gameIds || filter.gameIds.includes(game.id))
    .forEach((game) => {
      Object.entries(game.playerStats)
        .filter(
          ([playerId]) =>
            !filter.playerIds ||
            filter.playerIds.includes(playerId as PlayerId),
        )
        .forEach(([playerId, stats]) => {
          if (!playerStats[playerId]) {
            playerStats[playerId] = { ...stats };
          } else {
            Object.keys(stats).forEach((key) => {
              // @ts-expect-error: dynamic key assignment
              playerStats[playerId][key] =
                // @ts-expect-error: dynamic key assignment
                (playerStats[playerId][key] || 0) + (stats[key] || 0);
            });
          }
        });
    });
  const extraPlayerStats: Record<PlayerId, CalculatedStats> = {};
  Object.entries(playerStats).forEach(([playerId, stats]) => {
    const atBats = stats.atBats || 1;
    const hits = stats.hits || 0;
    const walks = stats.walks || 0;
    const runs = stats.runs || 0;
    const doubles = stats.doubles || 0;
    const triples = stats.triples || 0;
    const homeRuns = stats.homeRuns || 0;
    const runsBattedIn = stats.runsBattedIn || 0;
    const totalBases = hits + doubles + triples * 2 + homeRuns * 3;
    const battingAverage = roundFloat(hits / atBats, 3).toFixed(3);
    const onBasePercentage = roundFloat(
      (hits + walks) / (atBats + walks),
      3,
    ).toFixed(3);
    const sluggingPercentage = roundFloat(totalBases / atBats, 3).toFixed(3);
    extraPlayerStats[playerId] = {
      battingAverage,
      onBasePercentage,
      sluggingPercentage,
      inningsPitched: (
        Math.floor(stats.outsPitched / 3) +
        (stats.outsPitched % 3) / 10
      ).toString(),
      kPerNine: roundFloat(
        ((stats.ks || 0) / ((stats.outsPitched || 1) / 3)) * 9,
        2,
      ).toFixed(2),
      bbPerNine: roundFloat(
        ((stats.pWalks || 0) / ((stats.outsPitched || 1) / 3)) * 9,
        2,
      ).toFixed(2),
      era: roundFloat(
        (stats.earnedRuns / ((stats.outsPitched || 1) / 3)) * 9,
        2,
      ).toFixed(2),
      whip: roundFloat(
        (stats.hitsAllowed + stats.pWalks) / ((stats.outsPitched || 1) / 3),
        2,
      ).toFixed(2),
    };
  });
  const mergedPlayerStats: Record<PlayerId, AllStats> = {};
  Object.entries(playerStats).forEach(([playerId, stats]) => {
    mergedPlayerStats[playerId] = {
      ...stats,
      ...extraPlayerStats[playerId],
    };
  });

  return mergedPlayerStats;
}
