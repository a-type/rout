import { useGame } from '@/hooks/useGame';
import { clsx, Img } from '@a-type/ui';
import { withSuspense } from '@long-game/game-ui';
import { ComponentProps, useState } from 'react';
import cls from './GameIcon.module.css';

export interface GameIconProps
  extends Omit<ComponentProps<'img'>, 'src' | 'alt'> {
  gameId: string | null;
  className?: string;
  size?: number;
  border?: boolean;
}

export const GameIcon = withSuspense(
  function GameIcon({
    gameId,
    className,
    size,
    style,
    border,
    ...rest
  }: GameIconProps) {
    const game = useGame(gameId);
    const [fallback, setFallback] = useState(false);

    return (
      <Img
        {...rest}
        src={`/game-data/${fallback ? 'empty' : (game?.id ?? 'empty')}/icon.png`}
        alt={`Icon for ${game?.title ?? 'unknown game'}`}
        style={{ width: size, height: size, ...style }}
        fit="cover"
        position="center"
        className={className}
        data-border={border}
        onError={() => setFallback(true)}
      />
    );
  },
  ({ className }) => <div className={clsx(cls.loading, className)} />,
);
