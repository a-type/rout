import { clsx, Tabs } from '@a-type/ui';
import { useState } from 'react';
import { hooks } from './gameClient.js';
import { PlayerChip } from './players/PlayerChip.js';
import {
  AllStats,
  battingStats,
  calculatePlayerStats,
  pitchingStats,
} from './stats.js';

const invertList: Array<keyof AllStats> = [
  'era',
  'whip',
  'bbPerNine',
  'fieldingIndependentPitching',
];

export function LeagueLeaders({ kind }: { kind: 'batting' | 'pitching' }) {
  const [tabValue, setTabValue] = useState<keyof AllStats>(
    kind === 'batting' ? battingStats[0].value : pitchingStats[0].value,
  );
  const { finalState } = hooks.useGameSuite();

  const playerStats = calculatePlayerStats(
    finalState.league.gameResults.flat(),
  );

  const findTop = (stat: keyof AllStats, count: number = 5) => {
    const isInverted = invertList.includes(stat);
    let list = Object.entries(playerStats)
      .filter(([, stats]) => {
        return (
          (kind === 'pitching' && (stats.outsPitched ?? 0) > 0) ||
          (kind === 'batting' &&
            (stats.atBats ?? 0) > finalState.league.currentWeek * 3)
        );
      })
      .sort(([, a], [, b]) => Number(b[stat] ?? 0) - Number(a[stat] ?? 0));
    if (isInverted) {
      list = list.reverse();
    }
    return list.slice(0, count).map(([playerId, stats]) => ({
      playerId,
      ...stats,
    }));
  };
  const results = findTop(tabValue);

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
                  'text-xs border-none rounded-none min-w-[1rem] bg-gray-wash hover:bg-gray ring-0',
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
        <table className="table-auto border border-gray rounded-lg shadow-sm">
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center p-4 color-gray-dark">
                  No players have stats for this category yet.
                </td>
              </tr>
            ) : (
              results.map((player) => {
                return (
                  <tr
                    key={player.playerId}
                    className="cursor-pointer hover:bg-gray/50 p-1"
                  >
                    <td className="text-left p-1 flex items-center gap-2">
                      <PlayerChip id={player.playerId} noBackground />
                    </td>
                    <td className="text-right p-1">{player[tabValue] ?? 0}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Tabs>
  );
}
