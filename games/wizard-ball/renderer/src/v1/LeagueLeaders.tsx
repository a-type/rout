import type {
  PlayerId,
  PlayerStats,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { clsx, Tabs } from '@a-type/ui';
import { PlayerName } from './PlayerName';
import { useSearchParams } from '@verdant-web/react-router';
import { useState } from 'react';
import {
  AllStats,
  battingStats,
  calculatePlayerStats,
  pitchingStats,
} from './stats';

const invertList = ['era', 'whip', 'bbPerNine'];

export function LeagueLeaders({ kind }: { kind: 'batting' | 'pitching' }) {
  const [tabValue, setTabValue] = useState<keyof AllStats>(
    kind === 'batting' ? battingStats[0].value : pitchingStats[0].value,
  );
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
          {(kind === 'batting' ? battingStats : pitchingStats).map(
            (option, idx, arr) => (
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
            ),
          )}
        </Tabs.List>
        <h2 className="mb-1">
          {kind === 'batting' ? 'Batting' : 'Pitching'} Leaders
        </h2>
        <table className="table-auto border border-gray-300 rounded-lg shadow-sm">
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
