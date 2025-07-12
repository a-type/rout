import { useStableCallback } from '@a-type/ui';
import { useEffect, useRef } from 'react';
import { boundsRegistry, useTagBounds } from './bounds';
import { dndEvents } from './dndEvents';
import {
  DraggableData,
  getDraggableData,
  useDndStore,
  useDraggedData,
} from './dndStore';
import { DragGestureContext } from './gestureStore';
import { TAGS } from './tags';

export interface DropInfo {
  relativePosition: { x: number; y: number };
  droppableRect: { x: number; y: number; width: number; height: number };
}

export type OnDropCb<T> = (
  draggable: DraggableData<T>,
  gesture: DragGestureContext,
  dropInfo: DropInfo,
) => void;

export type OnOverCb<T> = (draggable: DraggableData<T> | null) => void;

export type OnRejectCb<T> = (draggable: DraggableData<T>) => void;
export type Accept<T> = (draggable: DraggableData<T>) => boolean;

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
        const data = getDraggableData(dragged);
        if (stableAccept({ id: dragged, data })) {
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
          stableOnReject({ id: dragged, data });
        }
      }
    });
  }, [id, dropCb, stableAccept, stableOnReject, disabled]);

  const isAnyOver =
    useDndStore((state) => state.overRegion === id) && !disabled;
  const draggedData = useDraggedData();
  const rejected = !disabled && accept && draggedData && !accept(draggedData);
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
    stableOnOver?.(unvalidatedOver);
  }, [stableOnOver, unvalidatedOver]);

  useTagBounds(id, tags);

  return {
    isAcceptedOver,
    isAnyOver,
    rejected,
    draggedData,
  };
}
