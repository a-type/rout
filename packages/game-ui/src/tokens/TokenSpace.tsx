import { Box, clsx } from '@a-type/ui';
import { createContext, useContext, useState } from 'react';
import { DraggableData } from './dnd/dndStore';
import { Droppable, DroppableProps } from './dnd/Droppable';
import { DragGestureContext } from './dnd/gestureStore';
import { isToken, TokenDragData } from './types';

export interface TokenSpaceProps<T = any>
  extends Omit<DroppableProps, 'onDrop' | 'onReject' | 'onOver' | 'accept'> {
  onDrop?: (token: TokenDragData<T>, gesture: DragGestureContext) => void;
  className?: string;
  type?: string;
  /**
   * Validate dropping a token into this space. If you return true,
   * the token is allowed. If you return a string, it will be shown as an error message.
   * If you return false, the token is rejected without an error message.
   */
  accept?: (data: TokenDragData<T>) => boolean | string;
  onReject?: (data: TokenDragData<T>) => void;
  onNonTokenReject?: (data: DraggableData) => void;
  onOver?: (data: TokenDragData<T> | null) => void;
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
  onOver,
  ...rest
}: TokenSpaceProps<T>) {
  const [overError, setOverError] = useState<string | null>(null);

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
    return accept(data.data as TokenDragData<T>) === true;
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

  const handleOver = (data: DraggableData | null) => {
    if (data && isToken(data.data)) {
      onOver?.(data.data as TokenDragData<T>);
    }

    if (!accept || !data || !isToken(data.data)) {
      setOverError(null);
      return;
    }
    const result = accept(data.data as TokenDragData<T>);
    if (typeof result === 'string') {
      setOverError(result);
    } else {
      setOverError(null);
    }
  };

  return (
    <TokenSpaceContext.Provider value={{ id, type }}>
      <Droppable<TokenDragData>
        id={id}
        className={clsx(
          'relative',
          '[&[data-over=true]]:(scale-102)',
          'transition-transform',
          className,
        )}
        onDrop={(droppable, gesture) =>
          onDrop?.(droppable.data as TokenDragData<T>, gesture)
        }
        accept={wrappedAccept}
        onReject={wrappedOnReject}
        onOver={handleOver}
        {...rest}
      >
        {children}
        {overError && <TokenSpaceValidationMessage message={overError} />}
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
export function useMaybeTokenSpaceContext() {
  return useContext(TokenSpaceContext);
}

function TokenSpaceValidationMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="absolute bottom-100% left-1/2 translate-[-50%,0.5rem] w-80% flex justify-center">
      <Box
        surface="attention"
        p="lg"
        className="text-wrap shadow-sm animate-pop-up animate-duration-200"
      >
        {message}
      </Box>
    </div>
  );
}
