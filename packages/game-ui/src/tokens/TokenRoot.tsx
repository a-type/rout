import { HTMLProps, ReactNode } from 'react';
import { DndRoot } from './dnd/DndRoot';

export interface TokenRootProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode;
}

export function TokenRoot({ children, ...rest }: TokenRootProps) {
  return (
    <DndRoot debug {...rest}>
      {children}
    </DndRoot>
  );
}
