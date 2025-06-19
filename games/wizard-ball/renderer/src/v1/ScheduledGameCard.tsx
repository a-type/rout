import { Link } from 'react-router';
import { BallparkChip } from './BallparkChip';
import { hooks } from './gameClient';
import { TeamIcon } from './teams/TeamIcon';
import { TeamName } from './teams/TeamName';
import { WeatherChip } from './WeatherChip';

export function ScheduledGameCard({
  id,
  variant = 'default',
}: {
  id: string;
  variant?: 'small' | 'default';
}) {
  const { finalState } = hooks.useGameSuite();
  const game = finalState.league.schedule.flat().find((g) => g.id === id);
  if (!game) {
    return (
      <div className="flex items-center justify-center bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
        Game not found.
      </div>
    );
  }

  if (variant === 'small') {
    return (
      <Link to={{ search: `?gameId=${game.id}` }}>
        <div className="flex flex-row gap-2 items-center justify-between bg-gray-800 p-1 rounded">
          <span className="flex flex-row gap-1 items-center">
            <TeamIcon id={game.awayTeamId} size={12} />
            <TeamName bold id={game.awayTeamId} />
          </span>
          <span className="text-gray-500 font-bold">@</span>
          <span className="flex flex-row gap-1 items-center">
            <TeamIcon id={game.homeTeamId} size={12} />
            <TeamName bold id={game.homeTeamId} />
          </span>
          <span className="flex flex-row gap-2 items-center">
            <BallparkChip id={game.ballpark} />
            <WeatherChip id={game.weather} />
          </span>
        </div>
      </Link>
    );
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
}
