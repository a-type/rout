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
        'grid min-h-300px max-h-100vmin max-w-100vmin bg-wash p-xs',
        className,
      )}
      style={{
        ...style,
        gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
      }}
      {...rest}
    >
      {children}
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
      className={clsx('relative aspect-1', className)}
    >
      {children}
    </div>
  );
}
