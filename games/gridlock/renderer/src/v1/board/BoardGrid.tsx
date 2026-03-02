import { boardSize } from '@long-game/game-gridlock-definition/v1';
import clsx from 'clsx';
import { ReactNode } from 'react';

export interface BoardGridProps {
  className?: string;
  children?: ReactNode;
}

export function BoardGrid({ className, children }: BoardGridProps) {
  return (
    <div
      className={clsx('grid max-h-80vh bg-main-wash p-xs gap-xs', className)}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
      }}
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
}: {
  x: number;
  y: number;
  children?: ReactNode;
  className?: string;
  anchorNamespace?: string;
}) {
  return (
    <div
      style={{
        anchorName: `--${anchorNamespace}-${x}-${y}`,
        gridColumnStart: x + 1,
        gridRowStart: y + 1,
      }}
      className={clsx('relative aspect-1', className)}
    >
      {children}
    </div>
  );
}
