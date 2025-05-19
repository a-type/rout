import { PlayerStats } from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';

export function PlayerPage({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
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
    <div>
      <h1>{playerName}</h1>
      <h2>Team: {teamName}</h2>
      <h2>Positions: {playerPositions}</h2>
      <h2>Stats</h2>
      <table>
        <thead>
          <tr>
            <th>Game</th>
            <th>AB</th>
            <th>H</th>
            <th>2B</th>
            <th>3B</th>
            <th>HR</th>
            <th>RBI</th>
            <th>R</th>
            <th>W</th>
            <th>SO</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, index) => {
            const stats = game.playerStats[id];
            return (
              <tr key={index}>
                <td>{renderGameName(game.id)}</td>
                <td>{stats.atBats}</td>
                <td>{stats.hits}</td>
                <td>{stats.doubles}</td>
                <td>{stats.triples}</td>
                <td>{stats.homeRuns}</td>
                <td>{stats.runsBattedIn}</td>
                <td>{stats.runs}</td>
                <td>{stats.walks}</td>
                <td>{stats.strikeouts}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td>{totalPlayerStats.atBats}</td>
            <td>{totalPlayerStats.hits}</td>
            <td>{totalPlayerStats.doubles}</td>
            <td>{totalPlayerStats.triples}</td>
            <td>{totalPlayerStats.homeRuns}</td>
            <td>{totalPlayerStats.runsBattedIn}</td>
            <td>{totalPlayerStats.runs}</td>
            <td>{totalPlayerStats.walks}</td>
            <td>{totalPlayerStats.strikeouts}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
