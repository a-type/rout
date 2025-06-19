import { hooks } from './gameClient';
import { GameResultCard } from './GameResultsCard';

export function RecentResults() {
  const { finalState } = hooks.useGameSuite();
  const gameResults =
    finalState.league.gameResults[finalState.league.currentWeek - 1] || [];
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold mb-2">Recent Results</h2>
      <div className="flex flex-row gap-2 flex-wrap">
        {gameResults.length === 0 ? (
          <div className="flex items-center justify-center bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
            No games played yet this week.
          </div>
        ) : (
          gameResults.map((game) => {
            return <GameResultCard id={game.id} key={game.id} />;
          })
        )}
      </div>
    </div>
  );
}
