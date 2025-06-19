import { clsx } from '@a-type/ui';
import { Link } from 'react-router';
import { hooks } from '../gameClient';
import { ScheduledGameCard } from '../ScheduledGameCard';
import { GameResultCard } from '../GameResultsCard';

export function TeamSchedule({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const schedule = finalState.league.schedule;
  const mySchedule = schedule.flatMap((r) =>
    r.filter((g) => g.awayTeamId === id || g.homeTeamId === id),
  );

  const myGameResults = finalState.league.gameResults
    .flat()
    .filter((game) => game.winner === id || game.loser === id);

  return (
    <div>
      <h3 className="mt-4">Games</h3>
      <div className="flex flex-col gap-3 items-start">
        {mySchedule.map((game, index) => {
          if (!myGameResults[index]) {
            return (
              <ScheduledGameCard variant="small" key={index} id={game.id} />
            );
          }

          return <GameResultCard variant="small" key={index} id={game.id} />;
        })}
      </div>
    </div>
  );
}
