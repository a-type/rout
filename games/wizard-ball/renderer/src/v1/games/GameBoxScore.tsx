import { useSearchParams } from '@verdant-web/react-router';
import { hooks } from '../gameClient';
import { battingStats, calculatePlayerStats, pitchingStats } from '../stats';
import { useGameResults } from '../useGameResults';
import { Link } from 'react-router';
import { PlayerName } from '../players/PlayerName';
import { PlayerSpecies } from '../players/PlayerSpecies';
import { PlayerClass } from '../players/PlayerClass';
import { TeamIcon } from '../teams/TeamIcon';

type StatValue =
  | (typeof battingStats)[number]['value']
  | (typeof pitchingStats)[number]['value'];

const excludeFromBoxScore: Array<StatValue> = ['kPerNine', 'bbPerNine'];

const boxScoreBattingStats = battingStats.filter(
  (stat) => !excludeFromBoxScore.includes(stat.value as StatValue),
);
const boxScorePitchingStats = pitchingStats.filter(
  (stat) => !excludeFromBoxScore.includes(stat.value as StatValue),
);

export function GameBoxScore({ id }: { id: string }) {
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
  const homeTeamPlayers = game.teamData[game.homeTeamId].battingOrder;
  const awayTeamPlayers = game.teamData[game.awayTeamId].battingOrder;
  const stats = calculatePlayerStats([game]);
  return (
    <>
      <table className="mb-2 text-center border-collapse">
        <thead>
          <tr>
            <th />

            {awayInnings.map((i, idx) => (
              <th className="border-1 border-solid border-gray-300" key={idx}>
                {idx + 1}
              </th>
            ))}
            <th className="border-1 border-solid border-gray-300">R</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pl-2 py-1 text-left border-1 border-solid border-gray-300 flex items-center gap-1">
              <TeamIcon size={14} id={awayTeam.id} /> {awayTeam.name}
            </td>
            {awayInnings.map((i, idx) => (
              <td
                className="text-center border-1 border-solid border-gray-300"
                key={idx}
              >
                {i.runs}
              </td>
            ))}
            <td className="text-center border-1 border-solid border-gray-300">
              {awayTeamScore}
            </td>
          </tr>
          <tr>
            <td className="pl-2 py-1 text-left border-1 border-solid border-gray-300 flex items-center gap-1">
              <TeamIcon size={14} id={homeTeam.id} />
              {homeTeam.name}
            </td>
            {homeInnings.map((i, idx) => (
              <td
                className="text-center border-1 border-solid border-gray-300"
                key={idx}
              >
                {i.runs}
              </td>
            ))}
            {homeInnings.length < awayInnings.length && (
              <td className="text-center border-1 border-solid border-gray-300">
                X
              </td>
            )}
            <td className="text-center border-1 border-solid border-gray-300">
              {homeTeamScore}
            </td>
          </tr>
        </tbody>
      </table>

      <div>
        <h3 className="mb-1">Batting Stats</h3>
        <table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-center">
          <thead>
            <tr>
              <th>Player</th>
              {boxScoreBattingStats.map((stat) => (
                <th key={stat.value} className="p-1">
                  {stat.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-500/50">
              <td
                colSpan={boxScoreBattingStats.length + 1}
                className="text-center"
              >
                <strong className="flex items-center justify-center">
                  <TeamIcon size={14} id={awayTeam.id} /> {awayTeam.name}
                </strong>
              </td>
            </tr>
            {awayTeamPlayers.map((playerId) => (
              <tr
                key={playerId}
                className="cursor-pointer hover:bg-gray-500/50"
              >
                <td className="text-left">
                  <Link to={{ search: '?playerId=' + playerId }}>
                    <PlayerSpecies id={playerId} />
                    <PlayerClass id={playerId} />
                    <PlayerName id={playerId} />
                  </Link>
                </td>
                {boxScoreBattingStats.map((stat) => (
                  <td key={stat.value} className="p-1">
                    {stats[playerId][stat.value] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-500/50">
              <td
                colSpan={boxScoreBattingStats.length + 1}
                className="text-center"
              >
                <strong className="flex items-center justify-center">
                  <TeamIcon size={14} id={homeTeam.id} /> {homeTeam.name}
                </strong>
              </td>
            </tr>
            {homeTeamPlayers.map((playerId) => (
              <tr
                key={playerId}
                className="cursor-pointer hover:bg-gray-500/50"
              >
                <td className="text-left">
                  <Link to={{ search: '?playerId=' + playerId }}>
                    <PlayerSpecies id={playerId} />
                    <PlayerClass id={playerId} />
                    <PlayerName id={playerId} />
                  </Link>
                </td>
                {boxScoreBattingStats.map((stat) => (
                  <td key={stat.value} className="p-1">
                    {stats[playerId][stat.value] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <hr className="w-full h-1 bg-gray-700 my-4 border-none" />
      <div>
        <h3 className="mb-1">Pitching Stats</h3>
        <table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-center">
          <thead>
            <tr>
              <th>Player</th>
              {boxScorePitchingStats.map((stat) => (
                <th key={stat.value} className="p-1">
                  {stat.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-500/50">
              <td
                colSpan={boxScorePitchingStats.length + 1}
                className="text-center"
              >
                <strong className="flex items-center justify-center">
                  <TeamIcon size={14} id={homeTeam.id} /> {homeTeam.name}
                </strong>
              </td>
            </tr>
            {game.teamData[homeTeam.id].pitchers.map((pitcherId) => (
              <tr
                key={pitcherId}
                className="cursor-pointer hover:bg-gray-500/50"
              >
                <td className="text-left">
                  <Link to={{ search: '?playerId=' + pitcherId }}>
                    <PlayerSpecies id={pitcherId} />
                    <PlayerClass id={pitcherId} />
                    <PlayerName id={pitcherId} />
                  </Link>
                </td>
                {boxScorePitchingStats.map((stat) => (
                  <td key={stat.value} className="p-1">
                    {stats[pitcherId][stat.value] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-500/50">
              <td
                colSpan={boxScorePitchingStats.length + 1}
                className="text-center"
              >
                <strong className="flex items-center justify-center">
                  <TeamIcon size={14} id={awayTeam.id} /> {awayTeam.name}
                </strong>
              </td>
            </tr>
            {game.teamData[awayTeam.id].pitchers.map((pitcherId) => (
              <tr
                key={pitcherId}
                className="cursor-pointer hover:bg-gray-500/50"
              >
                <td className="text-left">
                  <Link to={{ search: '?playerId=' + pitcherId }}>
                    <PlayerSpecies id={pitcherId} />
                    <PlayerClass id={pitcherId} />
                    <PlayerName id={pitcherId} />
                  </Link>
                </td>
                {boxScorePitchingStats.map((stat) => (
                  <td key={stat.value} className="p-1">
                    {stats[pitcherId][stat.value] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
