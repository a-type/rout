import { clsx } from '@a-type/ui';
import { useDndMonitor, useDroppable } from '@dnd-kit/core';
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
  const { isOver } = useDroppable({
    id,
    disabled,
    data: {
      type: 'token-space',
    },
  });

  useDndMonitor({
    onDragEnd(event) {
      if (event.over?.id === id && isToken(event.active.data.current)) {
        const token = event.active.data.current;
        onDrop?.(token);
      }
    },
  });

  return (
    <div id={id} className={clsx('relative', className)} data-over={isOver}>
      {children}
    </div>
  );
}
