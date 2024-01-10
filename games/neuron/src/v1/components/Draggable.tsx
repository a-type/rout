import { useDraggable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { TileShape } from '../tiles.js';

export interface DraggableProps {
  id: string;
  children: ReactNode;
  data: { tile: TileShape };
}

export function Draggable({ id, children, data }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div {...attributes} {...listeners} ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}
