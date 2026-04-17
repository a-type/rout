import { clsx } from '@a-type/ui';
import { Link } from 'react-router';
import { hooks } from '../gameClient.js';

export function TeamStandings() {
  const { finalState, players } = hooks.useGameSuite();
  const teams = Object.values(finalState.league.teamLookup);
  const sortedTeams = teams.sort((a, b) => b.wins - a.wins);

  return (
    <div className="flex flex-col">
      <h2>Standings</h2>
      <table className="table-auto min-w-full border border-gray rounded-lg shadow-sm overflow-hidden">
        <thead className="bg-white color-gray-dark">
          <tr>
            <th className="p-1">Team</th>
            <th className="p-1">Wins</th>
            <th className="p-1">Losses</th>
            <th className="p-1">RD</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team, idx) => (
            <tr
              key={team.id}
              className={clsx(
                'cursor-pointer hover:bg-gray-light p-1',
                idx % 2 === 0 && 'bg-gray-wash',
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
              <td className="text-center p-1">{team.runDifferential}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
