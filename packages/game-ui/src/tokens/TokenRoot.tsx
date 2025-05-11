import { DndContext } from '@dnd-kit/core';
import { ReactNode } from 'react';

export interface TokenRootProps {
  children?: ReactNode;
}

export function TokenRoot({ children }: TokenRootProps) {
  return <DndContext>{children}</DndContext>;
}
