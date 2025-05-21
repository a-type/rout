import { Player, PlayerStats } from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { useSearchParams } from '@verdant-web/react-router';
import { clsx } from '@a-type/ui';
import React from 'react';
import { Attributes } from './Attributes';
import { speciesIcons } from '../../../definition/src/v1/speciesData';

export function PlayerPage({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const [, setSearchParams] = useSearchParams();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <div>Player not found</div>;
  }
  const team = player.teamId
    ? finalState.league.teamLookup[player.teamId]
    : null;
  const teamName = team ? team.name : 'Free Agent';
  const playerName = player.name;
  const playerPositions = player.positions.join(', ');
  const overall = Object.values(player.attributes).reduce((a, b) => a + b);

  const games = finalState.league.gameResults
    .flat()
    .filter((game) => game.playerStats[id]);

  const renderGameName = (gameId: string) => {
    const game = finalState.league.gameResults
      .flat()
      .find((game) => game.id === gameId);
    if (!game) {
      return gameId;
    }
    const homeTeam = finalState.league.teamLookup[game.homeTeamId];
    const awayTeam = finalState.league.teamLookup[game.awayTeamId];
    if (team && team.id === homeTeam.id) {
      return `vs ${awayTeam.name}`;
    }
    if (team && team.id === awayTeam.id) {
      return `@ ${homeTeam.name}`;
    }
    return `${homeTeam.name} vs ${awayTeam.name}`;
  };

  const totalPlayerStats = games
    .map((game) => game.playerStats[id])
    .reduce(
      (acc, stats) => {
        acc.hits += stats.hits;
        acc.runs += stats.runs;
        acc.walks += stats.walks;
        acc.strikeouts += stats.strikeouts;
        acc.atBats += stats.atBats;
        acc.doubles += stats.doubles;
        acc.triples += stats.triples;
        acc.homeRuns += stats.homeRuns;
        acc.runsBattedIn += stats.runsBattedIn;

        return acc;
      },
      {
        hits: 0,
        runs: 0,
        walks: 0,
        strikeouts: 0,
        atBats: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
        runsBattedIn: 0,
      } as PlayerStats,
    );
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-0">{playerName}</h1>
        <div className="flex flex-row gap-1 mb-4 items-center">
          <span style={{ fontSize: 24 }}>{speciesIcons[player.species]}</span>
          <span className="capitalize">{player.species}</span>
          <span className="capitalize">{player.class}</span>
        </div>
        <div className="mb-1 text-md">Team: {teamName}</div>
        <div className="mb-4 text-md">
          Positions: {playerPositions.toUpperCase()}
        </div>
      </div>
      <Attributes attributes={{ ...player.attributes, overall }} />
      <div>
        <h2 className="text-xl font-semibold mb-2">Stats</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
            <thead>
              <tr className="font-medium">
                <th className="px-3 py-2 border-b">Game</th>
                <th className="px-3 py-2 border-b">AB</th>
                <th className="px-3 py-2 border-b">H</th>
                <th className="px-3 py-2 border-b">2B</th>
                <th className="px-3 py-2 border-b">3B</th>
                <th className="px-3 py-2 border-b">HR</th>
                <th className="px-3 py-2 border-b">RBI</th>
                <th className="px-3 py-2 border-b">R</th>
                <th className="px-3 py-2 border-b">BB</th>
                <th className="px-3 py-2 border-b">SO</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, index) => {
                const stats = game.playerStats[id];
                return (
                  <tr
                    key={index}
                    className={clsx(
                      index % 2 === 0 && 'bg-gray-500/30',
                      'cursor-pointer hover:bg-gray-500/50',
                    )}
                    onClick={() => {
                      setSearchParams((params) => {
                        params.delete('teamId');
                        params.delete('playerId');
                        params.set('gameId', game.id);
                        return params;
                      });
                    }}
                  >
                    <td className="px-3 py-2 border-b">
                      {renderGameName(game.id)}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.atBats}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.hits}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.doubles}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.triples}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.homeRuns}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.runsBattedIn}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.runs}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.walks}
                    </td>
                    <td className="px-3 py-2 border-b text-center">
                      {stats.strikeouts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="px-3 py-2 border-t">Total</td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.atBats}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.hits}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.doubles}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.triples}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.homeRuns}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.runsBattedIn}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.runs}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.walks}
                </td>
                <td className="px-3 py-2 border-t text-center">
                  {totalPlayerStats.strikeouts}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
