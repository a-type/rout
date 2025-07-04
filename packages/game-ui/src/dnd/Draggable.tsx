import { clsx } from '@a-type/ui';
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  useMotionTemplate,
  useTransform,
} from 'motion/react';
import {
  ComponentType,
  createContext,
  memo,
  ReactNode,
  Ref,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { activeDragRef } from './DebugView';
import { registerDraggableData, useDndStore } from './dndStore';
import { DraggedBox } from './draggedBox';
import { DragGestureContext, gesture } from './gestureStore';
import { flipTransition } from './transitions';
import {
  DragGestureActivationConstraint,
  useDragGesture,
} from './useDragGesture';

export interface DraggableProps extends HTMLMotionProps<'div'> {
  id: string;
  data?: any;
  disabled?: boolean;
  children?: ReactNode;
  DraggedContainer?: DraggedContainerComponent;
  draggedClassName?: string;
}

function DraggableRoot({
  id,
  data,
  disabled = false,
  children,
  ...rest
}: DraggableProps) {
  const isDragged = useDndStore((state) => state.dragging === id);
  const isCandidate = useDndStore((state) => state.candidate === id);

  useEffect(() => registerDraggableData(id, data), [id, data]);

  const box = useState(() => new DraggedBox())[0];

  const isMoving = isDragged || isCandidate;
  useEffect(() => {
    activeDragRef.current = {
      id,
      disabled,
      box,
    };
  }, [isMoving, box, id, disabled]);

  const ctxValue = useMemo(
    () => ({
      id,
      data,
      disabled,
      box,
    }),
    [id, disabled, box],
  );

  return (
    <DraggableContext.Provider value={ctxValue}>
      <DndOverlayPortal
        enabled={isDragged || isCandidate}
        dragDisabled={disabled}
        box={box}
        id={id}
        {...rest}
      >
        {children}
      </DndOverlayPortal>
    </DraggableContext.Provider>
  );
}

export interface DraggableContextValue {
  id: string;
  disabled: boolean;
  box: DraggedBox;
}

const DraggableContext = createContext<DraggableContextValue | null>(null);
export function useDraggableContext() {
  const context = useContext(DraggableContext);
  if (!context) {
    throw new Error(
      'useDraggableContext must be used within a Draggable component',
    );
  }
  return context;
}

export interface DraggableHandleProps extends HTMLMotionProps<'div'> {
  activationConstraint?: DragGestureActivationConstraint;
  allowStartFromDragIn?: boolean;
}
function DraggableHandle({
  children,
  activationConstraint,
  allowStartFromDragIn = false,
  className,
  ...rest
}: DraggableHandleProps) {
  const { ref, isCandidate, isDragging, disabled } = useDragGesture({
    activationConstraint,
    allowStartFromDragIn,
  });

  return (
    <motion.div
      style={{
        touchAction: disabled ? 'initial' : 'none',
        pointerEvents: isCandidate ? 'none' : 'auto',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
      role="button"
      aria-roledescription="draggable"
      aria-describedby="dnd-instructions"
      tabIndex={0}
      data-draggable-handle
      data-disabled={disabled}
      data-candidate={isCandidate}
      data-dragging={isDragging}
      className={clsx(
        'select-none',
        !disabled && 'cursor-grab',
        !disabled && '[body.cursor-grabbing_&]:cursor-grabbing',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export const Draggable = Object.assign(DraggableRoot, {
  Handle: DraggableHandle,
});

interface DndOverlayPortalProps extends HTMLMotionProps<'div'> {
  children?: ReactNode;
  enabled?: boolean;
  /**
   * Override the component that implements the rendering of the dragged element.
   * This lets you customize how dragged items animate and appear.
   * Default just renders the contents snapped to the center of the cursor and
   * makes adjustments on touch to avoid the user's finger.
   */
  DraggedContainer?: DraggedContainerComponent;
  /**
   * Only applied to the dragged preview element
   */
  draggedClassName?: string;
  id: string;
  dragDisabled: boolean;
  box: DraggedBox;
}

/**
 * Selectively portals the dragged element to the overlay layer if it is being dragged.
 * Applies local (relative) movement to non-portaled content if any.
 */
const DndOverlayPortal = memo(function DndOverlayPortal({
  children,
  enabled,
  DraggedContainer,
  draggedClassName,
  className,
  id,
  dragDisabled,
  box,
  ...rest
}: DndOverlayPortalProps) {
  const overlayEl = useDndStore((state) => state.overlayElement);

  const isPortaling = enabled && !!overlayEl;

  return (
    <>
      {isPortaling &&
        createPortal(
          <DraggedRoot
            Container={DraggedContainer}
            {...rest}
            className={clsx('pointer-events-none', className, draggedClassName)}
          >
            {children}
          </DraggedRoot>,
          overlayEl,
        )}
      <motion.div
        layoutId={isPortaling ? undefined : id}
        key={`${id}-${isPortaling}`}
        transition={flipTransition}
        data-disabled={dragDisabled}
        data-draggable={id}
        data-is-moved={isPortaling}
        ref={dragDisabled ? undefined : box.bind}
        className={className}
        animate={{ width: isPortaling ? 0 : 'auto' }}
        style={{ opacity: isPortaling ? 0 : 1 }}
        {...rest}
      >
        {children}
      </motion.div>
    </>
  );
});

const DraggedRootContext = createContext(false);
export function useIsDragPreview() {
  return useContext(DraggedRootContext);
}

/**
 * Animates the movement of the dragged object according to drag gesture.
 * Updates the position of the dragged box and checks for overlapping drop regions.
 * Applies primary overlapped region to the DnD store.
 */
const DraggedRoot = memo(function DraggedRoot({
  children,
  ref,
  style,
  Container: UserContainer,
  ...rest
}: Omit<HTMLMotionProps<'div'>, 'draggable'> & {
  Container?: DraggedContainerComponent;
  children: ReactNode;
}) {
  const dragged = useDraggableContext();
  const status = useDndStore((state) =>
    state.dragging === dragged.id
      ? 'active'
      : state.candidate === dragged.id
        ? 'candidate'
        : 'inactive',
  );

  const ContainerImpl = UserContainer || DefaultDraggedContainer;

  return (
    <DraggedRootContext.Provider value={true}>
      <ContainerImpl
        ref={ref}
        draggable={dragged}
        status={status}
        gesture={gesture}
        {...rest}
      >
        <AnimatePresence>
          <motion.div
            layoutId={dragged.id}
            transition={flipTransition}
            data-draggable-preview={dragged.id}
            data-disabled={dragged.disabled}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </ContainerImpl>
    </DraggedRootContext.Provider>
  );
});

export type DraggedContainerComponent = ComponentType<{
  children?: ReactNode;
  draggable: DraggableContextValue;
  gesture: DragGestureContext;
  /**
   * The status of the drag operation on this element, if any.
   * Candidate means the object is being evaluated to decide if it qualifies to be dragged.
   * Active means the object is currently being dragged.
   * Inactive means the object is not being dragged.
   */
  status: 'active' | 'candidate' | 'inactive';
  ref: Ref<HTMLDivElement> | undefined;
  className?: string;
}>;

export const DefaultDraggedContainer: DraggedContainerComponent = ({
  children,
  ref,
  className,
}) => {
  const transform = useCenteredDragTransform(gesture);
  return (
    <motion.div
      style={{
        position: 'absolute',
        transform,
        zIndex: 1000000,
      }}
      ref={ref}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export function useCenteredDragTransform(gesture: DragGestureContext) {
  const { x, y } = gesture.current;
  const scale = useTransform(() => {
    return gesture.type === 'keyboard' ? 1.1 : 1;
  });
  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  return transform;
}
