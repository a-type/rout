import { clsx } from '@a-type/ui';
import games from '@long-game/games';

export interface GameIconProps {
  gameId: string;
  className?: string;
}

export function GameIcon({ gameId, className }: GameIconProps) {
  const game = games[gameId];

  return (
    <img
      src={`/game-data/${gameId}/icon.png`}
      alt={`Icon for ${game.title}`}
      className={clsx('object-cover', className)}
    />
  );
}
