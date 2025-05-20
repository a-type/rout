import type {
  PlayerId,
  PlayerStats,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { clsx, Tabs } from '@a-type/ui';
import { PlayerName } from './PlayerName';
import { useSearchParams } from '@verdant-web/react-router';
import { useState } from 'react';
import { roundFloat } from './utils';

type CalculatedStats = {
  battingAverage: string;
  onBasePercentage: string;
  sluggingPercentage: string;
};

const options: Array<{
  label: string;
  value: keyof (PlayerStats & CalculatedStats);
}> = [
  { label: 'H', value: 'hits' },
  { label: 'R', value: 'runs' },
  { label: 'BB', value: 'walks' },
  { label: 'SO', value: 'strikeouts' },
  { label: 'AB', value: 'atBats' },
  { label: '2B', value: 'doubles' },
  { label: '3B', value: 'triples' },
  { label: 'HR', value: 'homeRuns' },
  { label: 'RBI', value: 'runsBattedIn' },
  { label: 'BA', value: 'battingAverage' },
  { label: 'OBP', value: 'onBasePercentage' },
  { label: 'SLG', value: 'sluggingPercentage' },
];

export function LeagueLeaders() {
  const [tabValue, setTabValue] = useState<keyof PlayerStats>('hits');
  const { finalState } = hooks.useGameSuite();
  const [, setSearchParams] = useSearchParams();
  const playerStats: Record<PlayerId, PlayerStats> = {};
  finalState.league.gameResults.flat().forEach((game) => {
    Object.entries(game.playerStats).forEach(([playerId, stats]) => {
      if (!playerStats[playerId]) {
        playerStats[playerId] = { ...stats };
      } else {
        playerStats[playerId].hits += stats.hits;
        playerStats[playerId].runs += stats.runs;
        playerStats[playerId].walks += stats.walks;
        playerStats[playerId].strikeouts += stats.strikeouts;
        playerStats[playerId].atBats += stats.atBats;
        playerStats[playerId].doubles += stats.doubles;
        playerStats[playerId].triples += stats.triples;
        playerStats[playerId].homeRuns += stats.homeRuns;
        playerStats[playerId].runsBattedIn += stats.runsBattedIn;
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
    };
  });
  const mergedPlayerStats: Record<PlayerId, PlayerStats & CalculatedStats> = {};
  Object.entries(playerStats).forEach(([playerId, stats]) => {
    mergedPlayerStats[playerId] = {
      ...stats,
      ...extraPlayerStats[playerId],
    };
  });

  const findTop = (stat: keyof PlayerStats, count: number = 5) => {
    return Object.entries(mergedPlayerStats)
      .sort(([, a], [, b]) => b[stat] - a[stat])
      .slice(0, count)
      .map(([playerId, stats]) => ({
        playerId,
        ...stats,
      }));
  };

  return (
    <Tabs
      value={tabValue}
      onValueChange={(v) => setTabValue(v as keyof PlayerStats)}
    >
      <div className="flex flex-col p-1">
        <Tabs.List className="gap-none">
          {options.map((option, idx, arr) => (
            <Tabs.Trigger
              key={option.value}
              value={option.value as keyof PlayerStats}
              className={clsx(
                idx == 0 && 'rounded-l-lg',
                idx == arr.length - 1 && 'rounded-r-lg',
                'text-xs border-none rounded-none min-w-[1rem] bg-gray-700 hover:bg-gray-500 ring-0',
              )}
            >
              {option.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <h2 className="mb-1">League Leaders</h2>
        <table className="table-auto  border border-gray-300 rounded-lg shadow-sm">
          <tbody>
            {findTop(tabValue).map((player) => (
              <tr
                key={player.playerId}
                className="cursor-pointer hover:bg-gray-500/50 p-1"
                onClick={() => {
                  setSearchParams((params) => {
                    params.delete('teamId');
                    params.delete('gameId');
                    params.set('playerId', player.playerId);
                    return params;
                  });
                }}
              >
                <td className="text-left p-1">
                  <PlayerName id={player.playerId} />
                </td>
                <td className="text-right p-1">{player[tabValue]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Tabs>
  );
}
