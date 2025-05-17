import { clsx } from '@a-type/ui';
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

export function Token({
  children,
  id,
  data,
  className,
  disabled,
  ...rest
}: TokenProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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
      className={clsx('[&[data-dragging=true]]:(z-10000)', className)}
      data-disabled={disabled}
      data-dragging={!!isDragging}
      {...rest}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
