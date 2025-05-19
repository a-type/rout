import { hooks } from './gameClient';
import { Link, useSearchParams } from '@verdant-web/react-router';

export function TeamStandings() {
  const { finalState } = hooks.useGameSuite();
  const teams = Object.values(finalState.league.teamLookup);
  const sortedTeams = teams.sort((a, b) => b.wins - a.wins);
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="flex flex-col">
      <h2>Standings</h2>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Wins</th>
            <th>Losses</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team) => (
            <tr
              key={team.id}
              className="cursor-pointer hover:bg-gray-700 p-1"
              onClick={() => {
                setSearchParams((params) => {
                  params.set('teamId', team.id);
                  return params;
                });
              }}
            >
              <td>{team.name}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
