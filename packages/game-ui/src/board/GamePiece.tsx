import {
  SurfaceRoot,
  SurfaceHandle,
  useCreateSurface,
} from '@a-type/react-space';
import { GamePieceData } from '@long-game/common';
import { ReactNode, useEffect, useMemo } from 'react';
import { useGrid } from './GameBoard.js';

export interface GamePieceProps {
  value: GamePieceData;
  onChange: (updates: Omit<GamePieceData, 'id'>) => void;
  onTap?: () => void;
  className?: string;
  disableSelect?: boolean;
  disableDrag?: boolean;
  metadata?: any;
  children?: ReactNode;
}

export function GamePiece({
  value,
  onChange,
  className,
  disableSelect,
  disableDrag,
  metadata,
  onTap,
  children,
}: GamePieceProps) {
  const { size: gridSize } = useGrid();

  const gridPosition = useMemo(() => {
    return {
      x: value.position.x * gridSize,
      y: value.position.y * gridSize,
    };
  }, [value.position.x, value.position.y, gridSize]);

  const surface = useCreateSurface({
    id: value.id,
    initialTransform: {
      position: gridPosition,
      parent: value.containerId,
    },
    disableSelect,
    metadata,
    onDrop: (event, self) => {
      event.preventDefault();
      onChange({
        position: {
          x: Math.round(event.position.x / gridSize),
          y: Math.round(event.position.y / gridSize),
        },
        containerId: event.containerId,
      });
      self.update({
        parent: event.containerId,
        position: {
          x: Math.round(event.position.x / gridSize) * gridSize,
          y: Math.round(event.position.y / gridSize) * gridSize,
        },
      });
    },
    onTap,
  });

  useEffect(() => {
    surface.update({
      position: gridPosition,
      parent: value.containerId,
    });
  }, [gridPosition.x, gridPosition.y, value.containerId, surface]);

  return (
    <SurfaceRoot surface={surface} className={className}>
      <SurfaceHandle disabled={disableDrag}>{children}</SurfaceHandle>
    </SurfaceRoot>
  );
}
