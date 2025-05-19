import { clsx } from '@a-type/ui';
import { hooks } from './gameClient';
import { useSearchParams } from '@verdant-web/react-router';

export function TeamStandings() {
  const { finalState } = hooks.useGameSuite();
  const teams = Object.values(finalState.league.teamLookup);
  const sortedTeams = teams.sort((a, b) => b.wins - a.wins);
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="flex flex-col">
      <h2>Standings</h2>
      <table className="table-auto min-w-full border border-gray-300 rounded-lg shadow-sm">
        <thead className="bg-gray-800 text-light">
          <tr>
            <th className="p-1">Team</th>
            <th className="p-1">Wins</th>
            <th className="p-1">Losses</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team, idx) => (
            <tr
              key={team.id}
              className={clsx(
                'cursor-pointer hover:bg-gray-700 p-1',
                idx % 2 === 0 && 'bg-gray-500/30',
              )}
              onClick={() => {
                setSearchParams((params) => {
                  params.set('teamId', team.id);
                  return params;
                });
              }}
            >
              <td className="text-left p-1">{team.name}</td>
              <td className="text-center p-1">{team.wins}</td>
              <td className="text-center p-1">{team.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
