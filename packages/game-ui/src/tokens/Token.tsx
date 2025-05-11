import { useDraggable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { makeToken } from './types';

export interface TokenProps<Data = unknown> {
  children?: ReactNode;
  id: string;
  data?: Data;
  className?: string;
  disabled?: boolean;
}

export function Token({ children, id, data, className, disabled }: TokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: makeToken(id, data),
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
