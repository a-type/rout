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
  const {
    isAcceptedOver: isOver,
    rejected,
    isAnyOver: isDraggedOverThisRegion,
    draggedData,
  } = useDroppable({ onDrop, onOver, accept, onReject, id, disabled });
  const bindBounds = useBindBounds(id);
  const finalRef = useMergedRef<HTMLDivElement>(bindBounds, userRef);

  if (disabled) {
    return (
      <div
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
