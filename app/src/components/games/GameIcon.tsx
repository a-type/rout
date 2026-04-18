import { useGame } from '@/hooks/useGame';
import { clsx } from '@a-type/ui';
import { withSuspense } from '@long-game/game-ui';
import { ComponentProps, useState } from 'react';

export interface GameIconProps
  extends Omit<ComponentProps<'img'>, 'src' | 'alt'> {
  gameId: string | null;
  className?: string;
}

export const GameIcon = withSuspense(
  function GameIcon({ gameId, className, ...rest }: GameIconProps) {
    const game = useGame(gameId);
    const [fallback, setFallback] = useState(false);

    return (
      <img
        {...rest}
        src={`/game-data/${fallback ? 'empty' : (game?.id ?? 'empty')}/icon.png`}
        alt={`Icon for ${game?.title ?? 'unknown game'}`}
        className={clsx('object-cover object-center', className)}
        onError={() => setFallback(true)}
      />
    );
  },
  ({ className }) => (
    <div className={clsx('bg-gray-light animate-pulse', className)} />
  ),
);
