import { useStableCallback } from '@a-type/ui';
import { useEffect, useRef } from 'react';
import { boundsRegistry, useTagBounds } from './bounds.js';
import { draggableDataRegistry } from './dataRegistry.js';
import { dndEvents } from './dndEvents.js';
import { DraggableData, useDndStore, useDraggedData } from './dndStore.js';
import { DragGestureContext, gesture } from './gestureStore.js';
import { TAGS } from './tags.js';

export interface DropInfo {
  relativePosition: { x: number; y: number };
  droppableRect: { x: number; y: number; width: number; height: number };
}

export type OnDropCb<T> = (
  draggable: DraggableData<T>,
  gesture: DragGestureContext,
  dropInfo: DropInfo,
) => void;

export type OnOverCb<T> = (
  draggable: DraggableData<T> | null,
  gesture: DragGestureContext,
) => void;

export type OnRejectCb<T> = (
  draggable: DraggableData<T>,
  gesture: DragGestureContext,
) => void;
export type Accept<T> = (
  draggable: DraggableData<T>,
  gesture: DragGestureContext,
) => boolean;

const defaultAccept: Accept<any> = () => true;

const defaultTags = [TAGS.DROPPABLE, TAGS.DRAG_INTERACTIVE];

export function useDroppable<T>({
  onDrop,
  accept,
  onReject,
  id,
  onOver,
  disabled,
  tags = defaultTags,
}: {
  onDrop?: OnDropCb<T>;
  accept?: Accept<T>;
  onReject?: OnRejectCb<T>;
  id: string;
  onOver?: OnOverCb<T>;
  disabled?: boolean;
  tags?: string[];
}) {
  const dropCb = useStableCallback(onDrop);
  const stableAccept = useStableCallback(accept || defaultAccept);
  const stableOnReject = useStableCallback(onReject);

  useEffect(() => {
    if (disabled) return;

    return dndEvents.subscribe('drop', (dragged, targetId, gesture) => {
      if (targetId === id) {
        console.log('droppable drop', id);
        const data = draggableDataRegistry.get(dragged);
        if (stableAccept({ id: dragged, data }, gesture)) {
          const region = boundsRegistry.getEntry(id)!;
          const dropInfo: DropInfo = {
            relativePosition: {
              x: gesture.currentRaw.x - region.bounds.x,
              y: gesture.currentRaw.y - region.bounds.y,
            },
            droppableRect: region.bounds,
          };
          dropCb({ id: dragged, data }, gesture, dropInfo);
        } else if (stableOnReject) {
          stableOnReject({ id: dragged, data }, gesture);
        }
      }
    });
  }, [id, dropCb, stableAccept, stableOnReject, disabled]);

  const isAnyOver =
    useDndStore((state) => state.overRegion === id) && !disabled;
  const draggedData = useDraggedData();
  const rejected =
    !disabled && accept && draggedData && !accept(draggedData, gesture);
  const isAcceptedOver = !disabled && isAnyOver && !rejected;

  const wasOverRef = useRef(false);
  useEffect(() => {
    if (isAcceptedOver && !wasOverRef.current) {
      dndEvents.emit('over', id);
      wasOverRef.current = true;
    } else if (!isAcceptedOver && wasOverRef.current) {
      dndEvents.emit('out');
      wasOverRef.current = false;
    }
  }, [isAcceptedOver, id]);

  const stableOnOver = useStableCallback(onOver);
  const unvalidatedOver = isAnyOver ? draggedData : null;
  useEffect(() => {
    // Call the stable callback with
    stableOnOver?.(unvalidatedOver, gesture);
  }, [stableOnOver, unvalidatedOver]);

  useTagBounds(id, tags);

  return {
    isAcceptedOver,
    isAnyOver,
    rejected,
    draggedData,
  };
}
