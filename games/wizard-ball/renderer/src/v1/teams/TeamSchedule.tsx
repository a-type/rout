import { hooks } from '../gameClient.js';
import { GameResultCard } from '../GameResultsCard.js';
import { ScheduledGameCard } from '../ScheduledGameCard.js';

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
