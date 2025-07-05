import { ReactNode } from 'react';

/** @deprecated - DndRoot is included in root App structure, you don't need to render it yourself. */
export const TokenRoot = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
