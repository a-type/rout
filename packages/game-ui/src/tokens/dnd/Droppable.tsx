import { useStableCallback } from '@a-type/ui';
import { HTMLProps, useEffect } from 'react';
import { useMergedRef } from '../../hooks/useMergedRef';
import { dndEvents } from './dndEvents';
import { DraggableData, useDndStore } from './dndStore';
import { dropRegions, REGION_ID_ATTR } from './DropRegions';

export type DroppableProps<T = any> = Omit<
  HTMLProps<HTMLDivElement>,
  'onDrop' | 'accept'
> & {
  id: string;
  onDrop?: (draggable: DraggableData<T>) => void;
  disabled?: boolean;
  accept?: (draggable: DraggableData<T>) => boolean;
};

export function Droppable<T = any>({
  id,
  children,
  onDrop,
  disabled,
  ref: userRef,
  accept,
  ...rest
}: DroppableProps<T>) {
  const dropCb = useStableCallback(onDrop);
  const stableAccept = useStableCallback(accept);
  useEffect(() => {
    return dndEvents.subscribe('drop', (dragged, targetId) => {
      if (targetId === id) {
        const data = useDndStore.getState().data[dragged];
        if (!stableAccept || stableAccept({ id: dragged, data })) {
          dropCb({ id: dragged, data });
        }
      }
    });
  }, [id, dropCb]);

  const isOverRaw = useDndStore((state) => state.overRegion === id);
  const draggedId = useDndStore((state) => state.dragging);
  const draggedData = useDndStore((state) =>
    draggedId ? state.data[draggedId] : undefined,
  );
  const rejected =
    draggedId && accept && !accept({ id: draggedId, data: draggedData });
  const isOver = isOverRaw && draggedId && !rejected;

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
      data-over-rejected={rejected}
      {...rest}
    >
      {children}
    </div>
  );
}
