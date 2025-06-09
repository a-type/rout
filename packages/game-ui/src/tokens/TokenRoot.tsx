import { ReactNode } from 'react';
import { DndRoot } from './dnd/DndRoot';

export interface TokenRootProps {
  children?: ReactNode;
}

export function TokenRoot({ children }: TokenRootProps) {
  return <DndRoot>{children}</DndRoot>;
}
