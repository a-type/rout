import {
  ContainerRoot,
  SurfaceContainmentEvent,
  useCreateContainer,
  Vector2,
} from '@a-type/react-space';
import { ReactNode } from 'react';
import { useGrid } from './GameBoard.js';

export interface GamePlacementProps {
  id: string;
  position: Vector2;
  children?: ReactNode;
  className?: string;
  accept?: (event: SurfaceContainmentEvent) => boolean;
  priority?: number;
}

export function GamePlacement({
  id,
  position,
  className,
  accept,
  priority,
  children,
}: GamePlacementProps) {
  const { size: gridSize } = useGrid();

  const container = useCreateContainer({
    id,
    accept,
    priority,
  });

  return (
    <ContainerRoot
      container={container}
      style={{
        position: 'absolute',
        left: position.x * gridSize,
        top: position.y * gridSize,
      }}
      className={className}
    >
      {children}
    </ContainerRoot>
  );
}
