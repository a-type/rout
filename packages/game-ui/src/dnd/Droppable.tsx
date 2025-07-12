import { SlotDiv } from '@a-type/ui';
import { HTMLProps } from 'react';
import { useMergedRef } from '../hooks/useMergedRef';
import { useBindBounds } from './bounds';
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

  if (disabled) {
    return (
      <SlotDiv
        data-role="droppable"
        data-droppable-disabled
        ref={userRef}
        asChild={asChild}
        {...rest}
      >
        {children}
      </SlotDiv>
    );
  }

  return (
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
  );
}
