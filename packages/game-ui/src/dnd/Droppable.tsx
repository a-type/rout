import { useStableCallback } from '@a-type/ui';
import { HTMLProps, useEffect, useRef } from 'react';
import { useMergedRef } from '../hooks/useMergedRef';
import { dndEvents } from './dndEvents';
import { DraggableData, useDndStore, useDraggedData } from './dndStore';
import { dropRegions, REGION_ID_ATTR } from './DropRegions';
import { DragGestureContext } from './gestureStore';

export type DroppableProps<T = any> = Omit<
  HTMLProps<HTMLDivElement>,
  'onDrop' | 'accept'
> & {
  id: string;
  onDrop?: (draggable: DraggableData<T>, gesture: DragGestureContext) => void;
  onOver?: (draggable: DraggableData<T> | null) => void;
  onReject?: (draggable: DraggableData<T>) => void;
  disabled?: boolean;
  accept?: (draggable: DraggableData<T>) => boolean;
};

export function Droppable<T = any>({
  id,
  children,
  onDrop,
  onOver,
  disabled,
  ref: userRef,
  accept,
  onReject,
  ...rest
}: DroppableProps<T>) {
  const dropCb = useStableCallback(onDrop);
  const stableAccept = useStableCallback(accept);
  const stableOnReject = useStableCallback(onReject);
  useEffect(() => {
    return dndEvents.subscribe('drop', (dragged, targetId, gesture) => {
      if (targetId === id) {
        const data = useDndStore.getState().data[dragged];
        if (!stableAccept || stableAccept({ id: dragged, data })) {
          dropCb({ id: dragged, data }, gesture);
        } else if (stableOnReject) {
          stableOnReject({ id: dragged, data });
        }
      }
    });
  }, [id, dropCb, stableAccept, stableOnReject]);

  const isDraggedOverThisRegion = useDndStore(
    (state) => state.overRegion === id,
  );
  const draggedData = useDraggedData();
  const rejected = accept && draggedData && !accept(draggedData);
  const isOver = isDraggedOverThisRegion && !rejected;

  const wasOverRef = useRef(false);
  useEffect(() => {
    if (isOver && !wasOverRef.current) {
      dndEvents.emit('over', id);
      wasOverRef.current = true;
    } else if (!isOver && wasOverRef.current) {
      dndEvents.emit('out');
      wasOverRef.current = false;
    }
  }, [isOver, id]);

  const stableOnOver = useStableCallback(onOver);
  const unvalidatedOver = isDraggedOverThisRegion ? draggedData : null;
  useEffect(() => {
    // Call the stable callback with
    stableOnOver?.(unvalidatedOver);
  }, [stableOnOver, unvalidatedOver]);

  const finalRef = useMergedRef<HTMLDivElement>(dropRegions.register, userRef);

  if (disabled) {
    return (
      <div
        {...{ [REGION_ID_ATTR]: id }}
        data-role="droppable"
        data-droppable-disabled
        ref={userRef}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      {...{ [REGION_ID_ATTR]: id }}
      data-role="droppable"
      ref={finalRef}
      data-over={isOver}
      data-over-rejected={rejected && isDraggedOverThisRegion}
      data-dragged-rejected={rejected}
      data-dragged-accepted={!!draggedData && !rejected}
      {...rest}
    >
      {children}
    </div>
  );
}
