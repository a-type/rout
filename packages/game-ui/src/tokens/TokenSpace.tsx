import { Box, clsx } from '@a-type/ui';
import { useMemo, useState } from 'react';
import { DraggableData, getDraggableData } from '../dnd/dndStore';
import {
  Droppable,
  DroppableProps,
  useParentDroppable,
} from '../dnd/Droppable';
import { DragGestureContext } from '../dnd/gestureStore';
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
  /**
   * Like onOver, but only for accepted tokens.
   */
  onOverAccepted?: (data: TokenDragData<T> | null) => void;
}

const tokenSpaceTags = ['token-space'];
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
  onOverAccepted,
  tags,
  ...rest
}: TokenSpaceProps<T>) {
  const [overError, setOverError] = useState<string | null>(null);

  const wrappedAccept = (data: DraggableData, gesture: DragGestureContext) => {
    // only accept tokens
    if (!isToken(data.data)) {
      return false;
    }

    // do not accept tokens already in this space
    if (gesture.draggedFrom === id) {
      return false;
    }

    if (!accept) return true;
    return accept(data.data as TokenDragData<T>) === true;
  };

  const wrappedOnReject = (
    data: DraggableData,
    gesture: DragGestureContext,
  ) => {
    if (!isToken(data.data)) {
      console.debug(`TokenSpace: rejecting non-token data ${data.id}`);
      return onNonTokenReject?.(data);
    }
    if (gesture.draggedFrom === id) {
      console.debug(
        `TokenSpace: rejecting token ${data.id} that is already in this space`,
      );
      // do not notify user of tokens already in this space
      return;
    }
    return onReject?.(data.data as TokenDragData<T>);
  };

  const handleOver = (data: DraggableData | null) => {
    if (!data) {
      onOver?.(null);
      onOverAccepted?.(null);
      setOverError(null);
      return;
    }
    if (data && isToken(data.data)) {
      onOver?.(data.data as TokenDragData<T>);
    }

    if (!isToken(data.data)) {
      setOverError(null);
      return;
    }
    if (!accept) {
      onOverAccepted?.(data.data as TokenDragData<T>);
      setOverError(null);
      return;
    }
    const result = accept(data.data as TokenDragData<T>);
    if (typeof result === 'string') {
      setOverError(result);
    } else {
      setOverError(null);
      onOverAccepted?.(data.data as TokenDragData<T>);
    }
  };

  const data = useMemo<TokenSpaceData>(
    () => ({ isTokenSpace: true, type }),
    [type],
  );

  return (
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
      tags={tokenSpaceTags}
      data={data}
      {...rest}
    >
      {children}
      {overError && <TokenSpaceValidationMessage message={overError} />}
    </Droppable>
  );
}

export interface TokenSpaceData {
  type?: string;
  isTokenSpace: boolean;
}

function TokenSpaceValidationMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="absolute bottom-100% left-1/2 translate-[-50%,0.5rem] w-600px flex justify-center">
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

export function useMaybeParentTokenSpace() {
  const parentId = useParentDroppable();
  if (!parentId) return null;
  const data = getDraggableData(parentId);
  if (!data || data.tokenSpace) return null;
  return data as TokenSpaceData;
}
