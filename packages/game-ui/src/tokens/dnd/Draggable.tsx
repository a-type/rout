import { clsx } from '@a-type/ui';
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  Transition,
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
import { useDndStore } from './dndStore';
import { DraggedBox } from './draggedBox';
import { DragGestureContext, gesture } from './gestureStore';
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

  const bindData = useDndStore((state) => state.bindData);
  // necessary for multiple concurrent draggables not to clobber...
  // TODO: simplify...
  const hasBoundData = useDndStore((state) => !!state.data[id]);
  const needsRebind = !!data && !hasBoundData;
  useEffect(() => bindData(id, data), [id, data, bindData, needsRebind]);

  const box = useState(() => new DraggedBox())[0];

  const ctxValue = useMemo(
    () => ({
      id,
      data,
      isDragged,
      isCandidate,
      disabled,
      box,
    }),
    [id, isDragged, isCandidate, disabled, box],
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
  isDragged: boolean;
  isCandidate: boolean;
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
export function useIsDragging() {
  const ctx = useContext(DraggableContext);
  return ctx?.isDragged || ctx?.isCandidate || false;
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

const flipTransition: Transition = { duration: 0.1, ease: 'easeInOut' };

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
      <AnimatePresence>
        <motion.div
          layoutId={id}
          transition={flipTransition}
          data-disabled={dragDisabled}
          data-draggable={id}
          ref={dragDisabled ? undefined : box.bind}
          className={className}
          {...rest}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
});

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

  useEffect(() => {
    // this is really just for debugging.
    if (dragged.isDragged) {
      activeDragRef.current = dragged;
      return () => {
        activeDragRef.current = null;
      };
    }
  }, [dragged.isDragged, dragged]);

  const ContainerImpl = UserContainer || DefaultDraggedContainer;

  return (
    <ContainerImpl ref={ref} draggable={dragged} gesture={gesture} {...rest}>
      <AnimatePresence>
        <motion.div
          layoutId={dragged.id}
          transition={flipTransition}
          data-draggable-preview={dragged.id}
          data-dragging={dragged.isDragged}
          data-candidate={dragged.isCandidate}
          data-disabled={dragged.disabled}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ContainerImpl>
  );
});

export type DraggedContainerComponent = ComponentType<{
  children?: ReactNode;
  draggable: DraggableContextValue;
  gesture: DragGestureContext;
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
  const touchAdjustedY = useTransform(() => {
    return y.get() + (gesture.type === 'touch' ? -40 : 0);
  });
  const scale = useTransform(() => {
    return gesture.type === 'keyboard' ? 1.1 : 1;
  });
  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${x}px, ${touchAdjustedY}px, 0) scale(${scale})`;
  return transform;
}
