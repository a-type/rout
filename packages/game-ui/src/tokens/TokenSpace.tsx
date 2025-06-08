import { clsx } from '@a-type/ui';
import { useDragDropMonitor, useDroppable } from '@dnd-kit/react';
import { ReactNode } from 'react';
import { isToken, TokenDragData } from './types';

export interface TokenSpaceProps {
  id: string;
  children?: ReactNode;
  onDrop?: (token: TokenDragData) => void;
  disabled?: boolean;
  className?: string;
}

export function TokenSpace({
  id,
  children,
  onDrop,
  disabled,
  className,
}: TokenSpaceProps) {
  const { isDropTarget, ref } = useDroppable({
    id,
    disabled,
    data: {
      type: 'token-space',
    },
  });

  useDragDropMonitor({
    onDragEnd(event) {
      const over = event.operation.target;
      const source = event.operation.source;
      if (!source || !over) return;
      if (over?.id === id && isToken(source.data)) {
        const token = source.data;
        onDrop?.(token);
      }
    },
  });

  return (
    <div
      id={id}
      className={clsx(
        'relative',
        isDropTarget && 'ring-primary ring-2 ring-solid',
        className,
      )}
      data-over={isDropTarget}
      ref={ref}
    >
      {children}
    </div>
  );
}
