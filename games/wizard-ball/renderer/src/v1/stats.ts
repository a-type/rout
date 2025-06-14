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
  onBasePlusSlugging: string; // OPS is often calculated as OBP + SLG
  sluggingPercentage: string;
  inningsPitched: string;
  era: string;
  whip: string;
  kPerNine: string;
  bbPerNine: string;
  runsCreated: string;
  fieldingIndependentPitching: string; // FIP
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
  { label: 'OPS', value: 'onBasePlusSlugging' },
  { label: 'RC', value: 'runsCreated' },
  { label: 'DP', value: 'doublePlays' },
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
  { label: 'SV', value: 'saves' },
  { label: 'FIP', value: 'fieldingIndependentPitching' },
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
    const {
      atBats = 1,
      hits = 0,
      walks = 0,
      doubles = 0,
      triples = 0,
      homeRuns = 0,
      outsPitched = 0,
      ks = 0,
      pWalks = 0,
      earnedRuns = 0,
      hitsAllowed = 0,
      homeRunsAllowed = 0,
    } = stats;
    const totalBases = hits + doubles + triples * 2 + homeRuns * 3;
    const battingAverage = roundFloat(hits / atBats, 3).toFixed(3);
    const onBasePercentage = roundFloat(
      (hits + walks) / (atBats + walks),
      3,
    ).toFixed(3);
    const sluggingPercentage = roundFloat(totalBases / atBats, 3).toFixed(3);
    const inningsPitched = outsPitched / 3; // Convert outs to innings
    extraPlayerStats[playerId] = {
      battingAverage,
      onBasePercentage,
      sluggingPercentage,
      onBasePlusSlugging: roundFloat(
        parseFloat(onBasePercentage) + parseFloat(sluggingPercentage),
        3,
      ).toFixed(3),
      inningsPitched: (
        Math.floor(inningsPitched) +
        (outsPitched % 3) / 10
      ).toString(),
      kPerNine: roundFloat((ks / (inningsPitched || 1)) * 9, 2).toFixed(2),
      bbPerNine: roundFloat((pWalks / (inningsPitched || 1)) * 9, 2).toFixed(2),
      era: roundFloat((earnedRuns / (inningsPitched || 1)) * 9, 2).toFixed(2),
      whip: roundFloat(
        (hitsAllowed + pWalks) / (inningsPitched || 1),
        2,
      ).toFixed(2),
      runsCreated: Math.floor(
        (hits + walks) * (totalBases / (atBats || 1 + walks)),
      ).toString(),
      // TODO: Calculate actual FIP constant?
      fieldingIndependentPitching: roundFloat(
        3.2 +
          (13 * homeRunsAllowed + 3 * pWalks - 2 * ks) / (inningsPitched || 1),
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
