import { hooks } from './gameClient';
import { TeamIcon } from './teams/TeamIcon';
import { TeamName } from './teams/TeamName';
import dayjs from 'dayjs';
import { WeatherChip } from './WeatherChip';

export function UpcomingGames() {
  const { finalState, latestRoundIndex, nextRoundCheckAt } =
    hooks.useGameSuite();
  const upcomingGames = finalState.league.schedule[latestRoundIndex + 1] || [];
  const nextRoundText = nextRoundCheckAt
    ? dayjs(nextRoundCheckAt).format('MMM D, YYYY h:mm A')
    : null;
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold mb-2">
        Upcoming Games {nextRoundText ? `at ${nextRoundText}` : null}
      </h2>
      <div className="flex flex-row gap-2">
        {upcomingGames.map((game) => {
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
              <WeatherChip id={game.weather} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
