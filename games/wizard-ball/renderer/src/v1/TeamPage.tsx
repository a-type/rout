import { Button, clsx } from '@a-type/ui';
import type { Team, TeamId } from '../../../definition/src/v1/types';
import { hooks } from './gameClient';
import { Player } from './Player';
import { useSearchParams } from '@verdant-web/react-router';

export function TeamPage({ id }: { id: TeamId }) {
  const { finalState } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id] as Team;
  const [, setSearchParams] = useSearchParams();
  const schedule = finalState.league.schedule;
  const mySchedule = schedule.flatMap((r) =>
    r.filter((g) => g.awayTeamId === id || g.homeTeamId === id),
  );
  const myGameResults = finalState.league.gameResults.flatMap((round) =>
    round.filter((r) => r.winner === id || r.loser === id),
  );

  return (
    <div className="flex flex-col p-2">
      <div>
        <Button
          onClick={() => {
            setSearchParams((params) => {
              params.delete('teamId');
              return params;
            });
          }}
        >
          Back
        </Button>
      </div>
      <h2>{team.name}</h2>
      <span>
        Record: {team.wins} - {team.losses}
      </span>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="mt-4">Players</h3>
          <div className="flex flex-col">
            {team.playerIds.map((playerId) => (
              <Player key={playerId} id={playerId} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mt-4">Games</h3>
          <div className="flex flex-col">
            {mySchedule.map((game, index) => {
              if (!myGameResults[index]) {
                const homeTeam = finalState.league.teamLookup[game.homeTeamId];
                const awayTeam = finalState.league.teamLookup[game.awayTeamId];
                const location = game.homeTeamId === id ? 'Home' : 'Away';
                const opponent = game.homeTeamId === id ? awayTeam : homeTeam;
                return (
                  <div key={index} className="text-sm">
                    {location} vs {opponent.name}
                  </div>
                );
              }
              const { winner, loser, score: gameScore } = myGameResults[index];
              // Format the game result as either WIN or LOSS vs opponent with score in parentheses
              const win = winner === id;
              const opponentId = winner === id ? loser : winner;
              const opponent = finalState.league.teamLookup[opponentId];
              const score = gameScore[id] + ' - ' + gameScore[opponentId];
              const home = game.homeTeamId === id;
              const gameResult = win ? 'WIN' : 'LOSS';
              const location = home ? 'home' : 'away';
              const result = `${gameResult} (${location}) vs ${opponent.name} (${score})`;
              return (
                <div
                  key={index}
                  className={clsx(
                    'text-sm',
                    win ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {result}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
