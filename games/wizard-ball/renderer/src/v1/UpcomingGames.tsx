import { hooks } from './gameClient';
import { TeamIcon } from './teams/TeamIcon';
import { TeamName } from './teams/TeamName';

export function UpcomingGames() {
  const { finalState, latestRoundIndex } = hooks.useGameSuite();
  const upcomingGames = finalState.league.schedule[latestRoundIndex + 1] || [];
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold mb-2">Upcoming Games</h2>
      <div className="flex flex-row gap-2">
        {upcomingGames.map((game) => {
          return (
            <div
              key={game.id}
              className="flex items-center justify-between bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded"
            >
              <div className="flex flex-col items-center gap-2">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
