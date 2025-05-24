import {
  PlayerStats,
  speciesIcons,
  perks,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { useSearchParams } from '@verdant-web/react-router';
import { clsx } from '@a-type/ui';
import { Attributes } from './Attributes';
import { battingStats, calculatePlayerStats, pitchingStats } from './stats';

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

  const totalPlayerStats = calculatePlayerStats(finalState.league, {
    playerIds: [id],
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-0">{playerName}</h1>
        <div className="flex flex-row gap-1 mb-4 items-center">
          <span style={{ fontSize: 24 }}>{speciesIcons[player.species]}</span>
          <span className="capitalize">{player.species}</span>
          <span className="capitalize">{player.class}</span>
        </div>
        <div className="mb-1 text-md">
          Team:{' '}
          {team ? (
            <div
              className="p1 inline-flex items-center gap-2 cursor-pointer hover:bg-gray-500/50 rounded"
              onClick={() => {
                setSearchParams((params) => {
                  params.delete('playerId');
                  params.set('teamId', team.id);
                  return params;
                });
              }}
            >
              {team.icon} {team.name} ({team.wins} - {team.losses})
            </div>
          ) : (
            'Free Agent'
          )}
        </div>
        <div className="mb-2 text-md">
          Positions: {playerPositions.toUpperCase()}
        </div>
      </div>
      <div>
        <h2>Perks</h2>
        {player.perkIds.map((perkId) => {
          const perk = perks[perkId as keyof typeof perks];
          if (!perk) {
            return null;
          }
          return (
            <div
              key={perkId}
              className="inline-flex flex-col mb-2 border-1 border-gray-200 border-solid bg-gray-500/30 p-2 rounded"
            >
              <span className="font-semibold">{perk.name}</span>
              <span>{perk.description}</span>
            </div>
          );
        })}
      </div>
      <Attributes attributes={{ ...player.attributes, overall }} />
      <div>
        <h2 className="text-xl font-semibold mb-2">Batting Stats</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
            <thead>
              <tr className="font-medium">
                <th className="px-3 py-2 border-b">Game</th>
                {battingStats.map((stat) => (
                  <th
                    key={stat.value}
                    className="px-3 py-2 border-b text-center"
                  >
                    {stat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((game, index) => {
                const stats = calculatePlayerStats(finalState.league, {
                  gameIds: [game.id],
                  playerIds: [id],
                })[id];
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
                    {battingStats.map((stat) => (
                      <td
                        key={stat.value}
                        className="px-3 py-2 border-b text-center"
                      >
                        {stats[stat.value]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="px-3 py-2 border-t">Total</td>
                {battingStats.map((stat) => (
                  <td
                    key={stat.value}
                    className="px-3 py-2 border-t text-center"
                  >
                    {totalPlayerStats[id][stat.value]}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        {player.positions.includes('p') && (
          <>
            <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold mb-2">Pitching Stats</h2>
              <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
                <thead>
                  <tr className="font-medium">
                    <th className="px-3 py-2 border-b">Game</th>
                    {pitchingStats.map((stat) => (
                      <th
                        key={stat.value}
                        className="px-3 py-2 border-b text-center"
                      >
                        {stat.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((game, index) => {
                    const stats = calculatePlayerStats(finalState.league, {
                      gameIds: [game.id],
                      playerIds: [id],
                    })[id];
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
                        {pitchingStats.map((stat) => (
                          <td
                            key={stat.value}
                            className="px-3 py-2 border-b text-center"
                          >
                            {stats[stat.value]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="px-3 py-2 border-t">Total</td>
                    {pitchingStats.map((stat) => (
                      <td
                        key={stat.value}
                        className="px-3 py-2 border-t text-center"
                      >
                        {totalPlayerStats[id][stat.value]}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
