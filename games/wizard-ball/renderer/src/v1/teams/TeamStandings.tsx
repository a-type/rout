import { clsx } from '@a-type/ui';
import { hooks } from '../gameClient';
import { useSearchParams } from '@verdant-web/react-router';
import { Link } from 'react-router';

export function TeamStandings() {
  const { finalState, players } = hooks.useGameSuite();
  const teams = Object.values(finalState.league.teamLookup);
  const sortedTeams = teams.sort((a, b) => b.wins - a.wins);

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
            >
              <td
                className="text-left pl-2 flex items-center gap-2"
                style={{
                  color: team.ownerId ? players[team.ownerId].color : 'inherit',
                }}
              >
                <Link
                  className="text-left pl-2 flex items-center gap-2"
                  to={{ search: '?teamId=' + team.id }}
                >
                  <span style={{ fontSize: 24 }}>{team.icon}</span>
                  {team.name}
                </Link>
              </td>
              <td className="text-center p-1">{team.wins}</td>
              <td className="text-center p-1">{team.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
