import { SlotDiv } from '@a-type/ui';
import { createContext, HTMLProps, useContext, useEffect } from 'react';
import { useMergedRef } from '../hooks/useMergedRef';
import { useBindBounds } from './bounds';
import { registerDraggableData } from './dndStore';
import {
  Accept,
  OnDropCb,
  OnOverCb,
  OnRejectCb,
  useDroppable,
} from './useDroppable';

export type DroppableProps<T = any> = Omit<
  HTMLProps<HTMLDivElement>,
  'onDrop' | 'accept'
> & {
  id: string;
  onDrop?: OnDropCb<T>;
  onOver?: OnOverCb<T>;
  onReject?: OnRejectCb<T>;
  disabled?: boolean;
  accept?: Accept<T>;
  asChild?: boolean;
  tags?: string[];
  data?: any;
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
  asChild,
  tags,
  data,
  ...rest
}: DroppableProps<T>) {
  const {
    isAcceptedOver: isOver,
    rejected,
    isAnyOver: isDraggedOverThisRegion,
    draggedData,
  } = useDroppable({ onDrop, onOver, accept, onReject, id, disabled, tags });
  const bindBounds = useBindBounds(id);
  const finalRef = useMergedRef<HTMLDivElement>(bindBounds, userRef);
  useEffect(() => registerDraggableData(id, data), [id, data]);

  return (
    <DroppableContext.Provider value={id}>
      {disabled ? (
        <SlotDiv
          data-role="droppable"
          data-droppable-disabled
          ref={userRef}
          asChild={asChild}
          {...rest}
        >
          {children}
        </SlotDiv>
      ) : (
        <SlotDiv
          data-role="droppable"
          ref={finalRef}
          data-over={isOver}
          data-over-rejected={rejected && isDraggedOverThisRegion}
          data-dragged-rejected={rejected}
          data-dragged-accepted={!!draggedData && !rejected}
          asChild={asChild}
          {...rest}
        >
          {children}
        </SlotDiv>
      )}
    </DroppableContext.Provider>
  );
}

const DroppableContext = createContext<string | null>(null);
export function useParentDroppable() {
  return useContext(DroppableContext);
}
