import { boardSize } from '@long-game/game-gridlock-definition/v1';
import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';
import './BoardGrid.css';

export interface BoardGridProps {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function BoardGrid({
  className,
  children,
  style,
  ...rest
}: BoardGridProps) {
  return (
    <div
      className={clsx(
        'w-auto h-auto max-w-full max-h-full flex flex-col items-center justify-center @container aspect-1',
        className,
      )}
    >
      <div
        className={clsx(
          'grid shrink bg-wash p-xs w-100cqmin h-100cqmin aspect-1',
        )}
        style={{
          ...style,
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, auto)`,
        }}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

export function BoardGridCell({
  x,
  y,
  children,
  className,
  anchorNamespace = 'cell',
  style,
}: {
  x: number;
  y: number;
  children?: ReactNode;
  className?: string;
  anchorNamespace?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...style,
        anchorName: `--${anchorNamespace}-${x}-${y}`,
        gridColumnStart: x + 1,
        gridRowStart: y + 1,
        animationDelay: `${(x + y) * 50}ms`,
        animationName: 'tile-bounce',
        animationDuration: '500ms',
        // bouncy
        animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        animationIterationCount: '1',
      }}
      className={clsx('relative w-full', className)}
    >
      {children}
    </div>
  );
}
