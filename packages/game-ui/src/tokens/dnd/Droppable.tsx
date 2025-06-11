import { useStableCallback } from '@a-type/ui';
import { HTMLProps, useEffect } from 'react';
import { useMergedRef } from '../../hooks/useMergedRef';
import { dndEvents } from './dndEvents';
import { DraggableData, useDndStore } from './dndStore';
import { dropRegions, REGION_ID_ATTR } from './DropRegions';

export type DroppableProps<T = any> = Omit<
  HTMLProps<HTMLDivElement>,
  'onDrop'
> & {
  id: string;
  onDrop?: (draggable: DraggableData<T>) => void;
  disabled?: boolean;
};

export function Droppable<T = any>({
  id,
  children,
  onDrop,
  disabled,
  ref: userRef,
  ...rest
}: DroppableProps<T>) {
  const dropCb = useStableCallback(onDrop);
  useEffect(() => {
    return dndEvents.subscribe('drop', (dragged, targetId) => {
      if (targetId === id) {
        dropCb({ id: dragged, data: useDndStore.getState().data[dragged] });
      }
    });
  }, [id, dropCb]);

  const isOver = useDndStore((state) => state.overRegion === id);

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
      {...rest}
    >
      {children}
    </div>
  );
}
