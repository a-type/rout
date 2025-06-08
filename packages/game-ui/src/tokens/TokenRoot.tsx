import { DragDropProvider } from '@dnd-kit/react';
import { ReactNode } from 'react';

export interface TokenRootProps {
  children?: ReactNode;
}

export function TokenRoot({ children }: TokenRootProps) {
  return <DragDropProvider>{children}</DragDropProvider>;
}
