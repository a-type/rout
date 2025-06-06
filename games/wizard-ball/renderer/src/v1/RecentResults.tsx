import { Link } from 'react-router';
import { hooks } from './gameClient';
import { TeamIcon } from './teams/TeamIcon';
import { TeamName } from './teams/TeamName';

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
            return (
              <Link key={game.id} to={{ search: `?gameId=${game.id}` }}>
                <div className="flex flex-col gap-2 items-center justify-between bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
                  <span className="flex flex-row gap-1 items-center">
                    <span className="font-bold">{game.score[game.winner]}</span>
                    <TeamIcon id={game.winner} size={12} />
                    <TeamName bold id={game.winner} />
                  </span>
                  <span className="flex flex-row gap-1 items-center">
                    <span className="font-bold">{game.score[game.loser]}</span>
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
  );
}
