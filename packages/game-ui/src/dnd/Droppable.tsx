import { useRender } from '@a-type/ui';
import {
  createContext,
  HTMLProps,
  ReactElement,
  Ref,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMergedRef } from '../hooks/useMergedRef.js';
import { useBindBounds } from './bounds.js';
import {
  draggableDataRegistry,
  droppableDataRegistry,
} from './dataRegistry.js';
import { useDndStore } from './dndStore.js';
import { gesture } from './gestureStore.js';
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
  render?: ReactElement;
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
  onDrop,
  onOver,
  disabled,
  ref: userRef,
  accept,
  onReject,
  render,
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
  const [localEl, localRef] = useState<HTMLDivElement | SVGGElement | null>(
    null,
  );
  const acceptStable = useRef(accept);
  acceptStable.current = accept;
  useEffect(() => {
    return useDndStore.subscribe(
      (state) => state.dragging,
      (draggedId) => {
        localEl?.setAttribute('data-dragging', draggedId ? 'true' : 'false');
        if (draggedId) {
          const data = draggableDataRegistry.get(draggedId);
          if (data) {
            console.log('Evaluating droppable accept with data', data);
            const accepted =
              !acceptStable.current ||
              acceptStable.current(
                {
                  id: draggedId,
                  data,
                },
                gesture,
              );
            localEl?.setAttribute(
              'data-dragged-accepted',
              accepted ? 'true' : 'false',
            );
          }
        } else {
          localEl?.removeAttribute('data-dragged-accepted');
        }
      },
      {
        fireImmediately: true,
      },
    );
  }, [localEl]);
  const finalRef = useMergedRef<any>(bindBounds, userRef, localRef);
  useEffect(() => droppableDataRegistry.register(id, data), [id, data]);

  const content = useRender({
    defaultTagName: svg ? 'g' : 'div',
    render,
    ref: disabled ? userRef : finalRef,
    props: rest as any,
    state: {
      role: 'droppable',
      droppableDisabled: disabled,
      overAccepted: isAcceptedOver,
      overRejected: isRejectedOver,
    },
    stateAttributesMapping: {
      role: () => ({ 'data-role': 'droppable' }),
      droppableDisabled: (value) =>
        value ? { 'data-droppable-disabled': '' } : null,
      overAccepted: (value) =>
        value === null
          ? null
          : { 'data-over-accepted': value ? 'true' : 'false' },
      overRejected: (value) =>
        value === null
          ? null
          : { 'data-over-rejected': value ? 'true' : 'false' },
    },
  });

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
