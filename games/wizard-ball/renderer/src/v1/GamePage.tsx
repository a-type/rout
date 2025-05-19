import { useSearchParams } from '@verdant-web/react-router';
import { hooks } from './gameClient';

export function GamePage({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const [, setSearchParams] = useSearchParams();
  const game = finalState.league.gameResults
    .flat()
    .find((game) => game.id === id);
  if (!game) {
    return <div>Game not found</div>;
  }
  const homeTeam = finalState.league.teamLookup[game.homeTeamId];
  const awayTeam = finalState.league.teamLookup[game.awayTeamId];
  const homeTeamScore = game.score[game.homeTeamId];
  const awayTeamScore = game.score[game.awayTeamId];
  const playerStats = game.playerStats;
  const homeTeamPlayers = game.teamData[game.homeTeamId].battingOrder;
  const awayTeamPlayers = game.teamData[game.awayTeamId].battingOrder;
  return (
    <div>
      <h1>
        {homeTeamScore > awayTeamScore ? (
          <>
            {homeTeam.name} {homeTeamScore}, {awayTeam.name} {awayTeamScore}
          </>
        ) : (
          <>
            {awayTeam.name} {awayTeamScore}, {homeTeam.name} {homeTeamScore}
          </>
        )}
      </h1>

      <h3>Player Stats</h3>
      <table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-center">
        <thead>
          <tr>
            <th>Player</th>
            <th>H</th>
            <th>R</th>
            <th>W</th>
            <th>SO</th>
            <th>AB</th>
            <th>2B</th>
            <th>3B</th>
            <th>HR</th>
            <th>RBI</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-gray-500/50">
            <td colSpan={10} className="text-center">
              <strong>{awayTeam.name}</strong>
            </td>
          </tr>
          {awayTeamPlayers
            .map((playerId) => [playerId, game.playerStats[playerId]] as const)
            .map(([playerId, stats]) => (
              <tr
                key={playerId}
                className="cursor-pointer hover:bg-gray-500/50"
                onClick={() => {
                  setSearchParams((params) => {
                    params.delete('teamId');
                    params.delete('gameId');
                    params.set('playerId', playerId);
                    return params;
                  });
                }}
              >
                <td className="text-left">
                  {finalState.league.playerLookup[playerId].name}
                </td>
                <td>{stats.hits}</td>
                <td>{stats.runs}</td>
                <td>{stats.walks}</td>
                <td>{stats.strikeouts}</td>
                <td>{stats.atBats}</td>
                <td>{stats.doubles}</td>
                <td>{stats.triples}</td>
                <td>{stats.homeRuns}</td>
                <td>{stats.runsBattedIn}</td>
              </tr>
            ))}
          <tr className="bg-gray-500/50">
            <td colSpan={10} className="text-center">
              <strong>{homeTeam.name}</strong>
            </td>
          </tr>
          {homeTeamPlayers
            .map((playerId) => [playerId, game.playerStats[playerId]] as const)
            .map(([playerId, stats]) => (
              <tr
                key={playerId}
                className="cursor-pointer hover:bg-gray-500/50"
                onClick={() => {
                  setSearchParams((params) => {
                    params.delete('teamId');
                    params.delete('gameId');
                    params.set('playerId', playerId);
                    return params;
                  });
                }}
              >
                <td className="text-left">
                  {finalState.league.playerLookup[playerId].name}
                </td>
                <td>{stats.hits}</td>
                <td>{stats.runs}</td>
                <td>{stats.walks}</td>
                <td>{stats.strikeouts}</td>
                <td>{stats.atBats}</td>
                <td>{stats.doubles}</td>
                <td>{stats.triples}</td>
                <td>{stats.homeRuns}</td>
                <td>{stats.runsBattedIn}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
