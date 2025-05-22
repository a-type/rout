import type {
  PlayerId,
  PlayerStats,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { clsx, Tabs } from '@a-type/ui';
import { PlayerName } from './PlayerName';
import { useSearchParams } from '@verdant-web/react-router';
import { useState } from 'react';
import { AllStats, CalculatedStats, calculatePlayerStats } from './stats';

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
  { label: 'SB', value: 'stolenBases' },
  { label: 'CS', value: 'caughtStealing' },
  { label: 'BA', value: 'battingAverage' },
  { label: 'OBP', value: 'onBasePercentage' },
  { label: 'SLG', value: 'sluggingPercentage' },
  { label: 'IP', value: 'inningsPitched' },
  { label: 'ER', value: 'earnedRuns' },
  { label: 'ERA', value: 'era' },
  { label: 'K', value: 'ks' },
  { label: 'BBA', value: 'pWalks' },
  { label: 'HA', value: 'hitsAllowed' },
  { label: 'HRA', value: 'homeRunsAllowed' },
  { label: 'WHIP', value: 'whip' },
  { label: 'K/9', value: 'kPerNine' },
  { label: 'BB/9', value: 'bbPerNine' },
];

const invertList = ['era', 'whip', 'bbPerNine'];

export function LeagueLeaders() {
  const [tabValue, setTabValue] = useState<keyof AllStats>('hits');
  const { finalState } = hooks.useGameSuite();
  const [, setSearchParams] = useSearchParams();
  const playerStats = calculatePlayerStats(finalState.league);

  const findTop = (stat: keyof AllStats, count: number = 10) => {
    const isInverted = invertList.includes(stat);
    let list = Object.entries(playerStats)
      .filter(([, stats]) => {
        return !isInverted || stats.outsPitched > 0;
      })
      .sort(([, a], [, b]) => Number(b[stat]) - Number(a[stat]));
    if (isInverted) {
      list = list.reverse();
    }
    return list.slice(0, count).map(([playerId, stats]) => ({
      playerId,
      ...stats,
    }));
  };

  return (
    <Tabs
      value={tabValue}
      onValueChange={(v) => setTabValue(v as keyof AllStats)}
    >
      <div className="flex flex-col p-1">
        <Tabs.List className="gap-none">
          {options.map((option, idx, arr) => (
            <Tabs.Trigger
              key={option.value}
              value={option.value as keyof AllStats}
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
