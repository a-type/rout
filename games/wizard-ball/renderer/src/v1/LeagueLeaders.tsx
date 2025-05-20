import type {
  PlayerId,
  PlayerStats,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { clsx, Tabs } from '@a-type/ui';
import { PlayerName } from './PlayerName';
import { useSearchParams } from '@verdant-web/react-router';
import { useState } from 'react';

const options: Array<{ label: string; value: keyof PlayerStats }> = [
  { label: 'H', value: 'hits' },
  { label: 'R', value: 'runs' },
  { label: 'W', value: 'walks' },
  { label: 'SO', value: 'strikeouts' },
  { label: 'AB', value: 'atBats' },
  { label: '2B', value: 'doubles' },
  { label: '3B', value: 'triples' },
  { label: 'HR', value: 'homeRuns' },
  { label: 'RBI', value: 'runsBattedIn' },
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
  const findTop = (stat: keyof PlayerStats, count: number = 5) => {
    return Object.entries(playerStats)
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
