import { useGame } from '@/hooks/useGame';
import { clsx } from '@a-type/ui';

export interface GameIconProps {
  gameId: string;
  className?: string;
}

export function GameIcon({ gameId, className }: GameIconProps) {
  const game = useGame(gameId);

  return (
    <img
      src={`/game-data/${gameId}/icon.png`}
      alt={`Icon for ${game.title}`}
      className={clsx('object-cover', className)}
    />
  );
}
