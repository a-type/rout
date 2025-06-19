import { Link } from 'react-router';
import { hooks } from './gameClient';
import { TeamIcon } from './teams/TeamIcon';
import { TeamName } from './teams/TeamName';

export function GameResultCard({
  id,
  variant = 'default',
}: {
  id: string;
  variant?: 'small' | 'default';
}) {
  const { finalState } = hooks.useGameSuite();
  const game = finalState.league.gameResults.flat().find((g) => g.id === id);
  if (!game) {
    return (
      <div className="flex items-center justify-center bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
        Game not found.
      </div>
    );
  }

  if (variant === 'small') {
    return (
      <Link key={game.id} to={{ search: `?gameId=${game.id}` }}>
        <div className="flex flex-row gap-2 items-center justify-between bg-gray-800 border-solid border-gray-300 px-2 py-4 rounded">
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
  }

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
}
