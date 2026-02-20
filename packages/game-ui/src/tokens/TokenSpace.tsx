import { clsx, Popover } from '@a-type/ui';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { droppableDataRegistry } from '../dnd/dataRegistry.js';
import { DraggableData } from '../dnd/dndStore.js';
import {
  Droppable,
  DroppableProps,
  useParentDroppable,
} from '../dnd/Droppable.js';
import { DragGestureContext } from '../dnd/gestureStore.js';
import { useMergedRef } from '../hooks/useMergedRef.js';
import { isToken, TokenDragData } from './types.js';

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
  validationMessageClassName?: string;
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
  validationMessageClassName,
  ref: userRef,
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

  const anchorRef = useRef<HTMLDivElement>(null);
  const finalRef = useMergedRef<any>(anchorRef, userRef);

  return (
    <Popover open={!!overError}>
      <Droppable<TokenDragData>
        id={id}
        ref={finalRef}
        className={clsx(
          'relative',
          '[&[data-over-accepted=true]]:(scale-102)',
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
      </Droppable>
      <Popover.Content
        anchor={anchorRef}
        side="top"
        align="center"
        sideOffset={8}
        className="palette-attention bg-attention-wash"
      >
        <Popover.Arrow />
        {overError}
      </Popover.Content>
    </Popover>
  );
}

export interface TokenSpaceData {
  type?: string;
  isTokenSpace: boolean;
}

export function useMaybeParentTokenSpace() {
  const parentId = useParentDroppable();

  const data = useSyncExternalStore(
    (cb) => droppableDataRegistry.subscribe(`update:${parentId}`, cb),
    () => (parentId ? droppableDataRegistry.get(parentId) : null),
    () => (parentId ? droppableDataRegistry.get(parentId) : null),
  );

  if (!parentId) {
    console.debug('no parent id');
    return null;
  }

  if (!data || data.tokenSpace) {
    console.debug(`parent ${parentId} is not a token space:`, data);
    return null;
  }

  return data as TokenSpaceData;
}
