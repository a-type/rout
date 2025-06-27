import { hooks } from '../gameClient';
import { TeamIcon } from '../teams/TeamIcon';
import { useGameResults } from '../useGameResults';

export function GameScoreboard({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const game = useGameResults({ id });
  if (!game) {
    return <div>Game not found</div>;
  }
  const homeTeam = finalState.league.teamLookup[game.homeTeamId];
  const awayTeam = finalState.league.teamLookup[game.awayTeamId];
  const homeTeamScore = game.score[game.homeTeamId];
  const awayTeamScore = game.score[game.awayTeamId];
  const inningData = game.inningData;
  const awayInnings = inningData.filter(
    (inning) => inning.battingTeam === game.awayTeamId,
  );
  const homeInnings = inningData.filter(
    (inning) => inning.battingTeam === game.homeTeamId,
  );

  return (
    <table className="mb-2 text-center border-collapse w-full">
      <thead>
        <tr>
          <th />

          {awayInnings.map((i, idx) => (
            <th className="border-1 border-solid border-gray-light" key={idx}>
              {idx + 1}
            </th>
          ))}
          <th className="border-1 border-solid border-gray-light">R</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="pl-2 py-1 text-left border-1 border-solid border-gray-light flex items-center gap-1">
            <TeamIcon size={14} id={awayTeam.id} /> {awayTeam.name}
          </td>
          {awayInnings.map((i, idx) => (
            <td
              className="text-center border-1 border-solid border-gray-light"
              key={idx}
            >
              {i.runs}
            </td>
          ))}
          <td className="text-center border-1 border-solid border-gray-light">
            {awayTeamScore}
          </td>
        </tr>
        <tr>
          <td className="pl-2 py-1 text-left border-1 border-solid border-gray-light flex items-center gap-1">
            <TeamIcon size={14} id={homeTeam.id} />
            {homeTeam.name}
          </td>
          {homeInnings.map((i, idx) => (
            <td
              className="text-center border-1 border-solid border-gray-light"
              key={idx}
            >
              {i.runs}
            </td>
          ))}
          {homeInnings.length < awayInnings.length && (
            <td className="text-center border-1 border-solid border-gray-light">
              X
            </td>
          )}
          <td className="text-center border-1 border-solid border-gray-light">
            {homeTeamScore}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
