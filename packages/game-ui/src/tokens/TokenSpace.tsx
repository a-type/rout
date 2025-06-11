import { clsx } from '@a-type/ui';
import { AnimatePresence } from 'motion/react';
import { createContext, useContext } from 'react';
import { Droppable, DroppableProps } from './dnd/Droppable';
import { TokenDragData } from './types';

export interface TokenSpaceProps extends Omit<DroppableProps, 'onDrop'> {
  onDrop?: (token: TokenDragData) => void;
  className?: string;
  type?: string;
}

export function TokenSpace({
  id,
  children,
  className,
  onDrop,
  type,
  ...rest
}: TokenSpaceProps) {
  return (
    <TokenSpaceContext.Provider value={{ id, type }}>
      <Droppable<TokenDragData>
        id={id}
        className={clsx(
          'relative',
          '[&[data-over=true]]:(ring-primary ring-2 ring-solid)',
          className,
        )}
        onDrop={(droppable) => onDrop?.(droppable.data)}
        {...rest}
      >
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </Droppable>
    </TokenSpaceContext.Provider>
  );
}

export interface TokenSpaceData {
  id: string;
  type?: string;
}

export const TokenSpaceContext = createContext<TokenSpaceData | null>(null);
export function useTokenSpaceContext() {
  const context = useContext(TokenSpaceContext);
  if (!context) {
    throw new Error(
      'useTokenSpaceContext must be used within a TokenSpace component',
    );
  }
  return context;
}
