import { clsx } from '@a-type/ui';
import { createContext, useContext } from 'react';
import { DraggableData } from './dnd/dndStore';
import { Droppable, DroppableProps } from './dnd/Droppable';
import { isToken, TokenDragData } from './types';

export interface TokenSpaceProps
  extends Omit<DroppableProps, 'onDrop' | 'accept'> {
  onDrop?: (token: TokenDragData) => void;
  className?: string;
  type?: string;
  accept?: (data: TokenDragData) => boolean;
}

export function TokenSpace({
  id,
  children,
  className,
  onDrop,
  type,
  accept,
  ...rest
}: TokenSpaceProps) {
  const wrappedAccept = (data: DraggableData) => {
    // only accept tokens
    if (!isToken(data.data)) {
      return false;
    }

    // do not accept tokens already in this space
    if (data.data.internal.space?.id === id) {
      return false;
    }

    if (!accept) return true;
    return accept(data.data);
  };

  return (
    <TokenSpaceContext.Provider value={{ id, type }}>
      <Droppable<TokenDragData>
        id={id}
        className={clsx(
          'relative',
          '[&[data-over=true]]:(scale-105)',
          'transition-transform',
          className,
        )}
        onDrop={(droppable) => onDrop?.(droppable.data)}
        accept={wrappedAccept}
        {...rest}
      >
        {children}
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
