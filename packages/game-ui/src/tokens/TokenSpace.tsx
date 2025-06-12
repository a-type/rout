import { clsx } from '@a-type/ui';
import { createContext, useContext } from 'react';
import { DraggableData } from './dnd/dndStore';
import { Droppable, DroppableProps } from './dnd/Droppable';
import { isToken, TokenDragData } from './types';

export interface TokenSpaceProps<T = any>
  extends Omit<DroppableProps, 'onDrop' | 'onReject' | 'accept'> {
  onDrop?: (token: TokenDragData<T>) => void;
  className?: string;
  type?: string;
  accept?: (data: TokenDragData<T>) => boolean;
  onReject?: (data: TokenDragData<T>) => void;
  onNonTokenReject?: (data: DraggableData) => void;
}

export function TokenSpace<T = any>({
  id,
  children,
  className,
  onDrop,
  type,
  accept,
  onReject,
  onNonTokenReject,
  ...rest
}: TokenSpaceProps<T>) {
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
    return accept(data.data as TokenDragData<T>);
  };

  const wrappedOnReject = (data: DraggableData) => {
    if (!isToken(data.data)) {
      return onNonTokenReject?.(data);
    }
    if (data.data.internal.space?.id === id) {
      // do not notify user of tokens already in this space
      return;
    }
    return onReject?.(data.data as TokenDragData<T>);
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
        onDrop={(droppable) => onDrop?.(droppable.data as TokenDragData<T>)}
        accept={wrappedAccept}
        onReject={wrappedOnReject}
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
