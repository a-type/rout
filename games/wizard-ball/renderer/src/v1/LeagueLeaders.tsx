import type {
  PlayerId,
  PlayerStats,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { Tabs } from '@a-type/ui';
import { PlayerName } from './PlayerName';
import { useSearchParams } from '@verdant-web/react-router';
import { useState } from 'react';

const options: Array<{ label: string; value: keyof PlayerStats }> = [
  { label: 'Hits', value: 'hits' },
  { label: 'Runs', value: 'runs' },
  { label: 'Walks', value: 'walks' },
  { label: 'Strikeouts', value: 'strikeouts' },
  { label: 'ABs', value: 'atBats' },
  { label: 'Doubles', value: 'doubles' },
  { label: 'Triples', value: 'triples' },
  { label: 'HRs', value: 'homeRuns' },
  { label: 'RBIs', value: 'runsBattedIn' },
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
      <div className="flex flex-col p-2">
        <Tabs.List className="mb-2">
          {options.map((option) => (
            <Tabs.Trigger
              key={option.value}
              value={option.value as keyof PlayerStats}
              className="text-sm"
            >
              {option.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <h2 className="mb-1">Leaders</h2>
        {findTop(tabValue).map((player) => (
          <div
            key={player.playerId}
            className="flex flex-row gap-2 items-center cursor-pointer hover:bg-gray-500/50 p-1"
            onClick={() => {
              setSearchParams((params) => {
                params.delete('teamId');
                params.delete('gameId');
                params.set('playerId', player.playerId);
                return params;
              });
            }}
          >
            <span className="text-sm">
              <PlayerName id={player.playerId} />
            </span>
            <span className="text-sm">{player[tabValue]}</span>
          </div>
        ))}
      </div>
    </Tabs>
  );
}
