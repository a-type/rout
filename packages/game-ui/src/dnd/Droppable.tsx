import { Slot } from '@a-type/ui';
import { createContext, HTMLProps, Ref, useContext, useEffect } from 'react';
import { useMergedRef } from '../hooks/useMergedRef.js';
import { useBindBounds } from './bounds.js';
import { droppableDataRegistry } from './dataRegistry.js';
import {
  Accept,
  OnDropCb,
  OnOverCb,
  OnRejectCb,
  useDroppable,
} from './useDroppable.js';

export type DroppableProps<T = any> = Omit<
  HTMLProps<HTMLDivElement>,
  'onDrop' | 'accept' | 'ref'
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
  /** Hides this droppable from any nested draggables */
  noParenting?: boolean;
  priority?: number; // for sorting purposes, higher means higher priority when bounds overlap
  svg?: boolean;
  ref?: Ref<any>;
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
  noParenting,
  priority,
  svg,
  ...rest
}: DroppableProps<T>) {
  const { isAcceptedOver, isRejectedOver } = useDroppable({
    onDrop,
    onOver,
    accept,
    onReject,
    id,
    disabled,
    tags,
  });
  const bindBounds = useBindBounds(id, priority);
  const finalRef = useMergedRef<any>(bindBounds, userRef);
  useEffect(() => droppableDataRegistry.register(id, data), [id, data]);

  const El = asChild ? Slot : svg ? 'g' : 'div';

  const content = disabled ? (
    <El
      data-role="droppable"
      data-droppable-disabled
      ref={userRef}
      {...(rest as any)}
    >
      {children}
    </El>
  ) : (
    <El
      data-role="droppable"
      ref={finalRef}
      data-over-accepted={isAcceptedOver}
      data-over-rejected={isRejectedOver}
      {...(rest as any)}
    >
      {children}
    </El>
  );

  if (noParenting) {
    return content;
  }

  return (
    <DroppableContext.Provider value={id}>{content}</DroppableContext.Provider>
  );
}

const DroppableContext = createContext<string | null>(null);
export function useParentDroppable() {
  return useContext(DroppableContext);
}
