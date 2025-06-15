import { Link } from 'react-router';
import { hooks } from './gameClient';
import { TeamIcon } from './teams/TeamIcon';
import { TeamName } from './teams/TeamName';
import { BallparkChip } from './BallparkChip';
import { WeatherChip } from './WeatherChip';

export function YourGameInfo() {
  const { finalState, playerId } = hooks.useGameSuite();
  const myTeamId = Object.entries(finalState.league.teamLookup).find(
    ([, team]) => team.ownerId === playerId,
  )?.[0];
  if (!myTeamId) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Game Info</h2>
        <div className="flex items-center justify-center bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
          You are not currently managing a team.
        </div>
      </div>
    );
  }
  const gameResults =
    finalState.league.gameResults[finalState.league.currentWeek - 1] || [];
  const upcomingGames =
    finalState.league.schedule[finalState.league.currentWeek] || [];
  return (
    <div className="grid mb-4 grid-cols-2">
      <div className="col-span-1">
        <h2 className="text-lg font-bold mb-2">Game Result</h2>
        <div className="flex flex-row gap-2 flex-wrap">
          {gameResults.length === 0 ? (
            <div className="flex items-center justify-center bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
              No games played yet this week.
            </div>
          ) : (
            gameResults
              .filter((gr) => [gr.awayTeamId, gr.homeTeamId].includes(myTeamId))
              .map((game) => {
                return (
                  <Link key={game.id} to={{ search: `?gameId=${game.id}` }}>
                    <div className="flex flex-col gap-2 items-center justify-between bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
                      <span className="flex flex-row gap-1 items-center">
                        <span className="font-bold">
                          {game.score[game.winner]}
                        </span>
                        <TeamIcon id={game.winner} size={12} />
                        <TeamName bold id={game.winner} />
                      </span>
                      <span className="flex flex-row gap-1 items-center">
                        <span className="font-bold">
                          {game.score[game.loser]}
                        </span>
                        <TeamIcon id={game.loser} size={12} />
                        <TeamName bold id={game.loser} />
                      </span>
                    </div>
                  </Link>
                );
              })
          )}
        </div>
      </div>
      <div className="col-span-1">
        <h2 className="text-lg font-bold mb-2">Upcoming Games</h2>
        <div className="flex flex-row gap-2 flex-wrap">
          {upcomingGames.map((game) => {
            if (![game.awayTeamId, game.homeTeamId].includes(myTeamId)) {
              return null;
            }
            return (
              <div
                key={game.id}
                className="flex flex-col gap-2 items-center justify-between bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded"
              >
                <div className="flex flex-row items-center gap-2">
                  <span className="flex flex-row gap-1 items-center">
                    <TeamIcon id={game.awayTeamId} size={12} />
                    <TeamName bold id={game.awayTeamId} />
                  </span>
                  <span className="text-gray-500 font-bold">@</span>
                  <span className="flex flex-row gap-1 items-center">
                    <TeamIcon id={game.homeTeamId} size={12} />
                    <TeamName bold id={game.homeTeamId} />
                  </span>
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <BallparkChip id={game.ballpark} />
                  <WeatherChip id={game.weather} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
