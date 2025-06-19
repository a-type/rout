import { hooks } from './gameClient';
import dayjs from 'dayjs';
import { ScheduledGameCard } from './ScheduledGameCard';

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
      <div className="flex flex-row gap-2 flex-wrap">
        {upcomingGames.map((game) => {
          return <ScheduledGameCard id={game.id} key={game.id} />;
        })}
      </div>
    </div>
  );
}
