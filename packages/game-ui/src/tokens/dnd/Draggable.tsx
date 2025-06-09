import { useDrag } from '@use-gesture/react';
import {
  HTMLMotionProps,
  motion,
  MotionValue,
  useAnimationFrame,
  useMotionValue,
} from 'motion/react';
import {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useMergedRef } from '../../hooks/useMergedRef';
import { useDraggedObjectMotionValues } from './animation';
import { useDndStore } from './dndStore';
import { draggedBox } from './draggedBox';
import { dropRegions } from './DropRegions';

export interface DraggableProps extends HTMLMotionProps<'div'> {
  id: string;
  data?: any;
  disabled?: boolean;
  draggingPlaceholder?: ReactNode;
  children?: ReactNode;
}

function DraggableRoot({
  id,
  data,
  disabled,
  children,
  draggingPlaceholder,
  ...rest
}: DraggableProps) {
  const isDragged = useDndStore((state) => state.dragging?.id === id);

  const localX = useMotionValue(0);
  const localY = useMotionValue(0);

  return (
    <DraggableContext.Provider
      value={{
        id,
        data,
        isDragged,
        localMovement: { x: localX, y: localY },
      }}
    >
      <DndOverlayPortal
        portaledFallback={draggingPlaceholder}
        enabled={isDragged}
        {...rest}
      >
        {children}
      </DndOverlayPortal>
    </DraggableContext.Provider>
  );
}

interface DraggableContextValue {
  id: string;
  data: any;
  isDragged: boolean;
  localMovement: {
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
}

const DraggableContext = createContext<DraggableContextValue | null>(null);
function useDraggableContext() {
  const context = useContext(DraggableContext);
  if (!context) {
    throw new Error(
      'useDraggableContext must be used within a Draggable component',
    );
  }
  return context;
}

export interface DragHandleGestureContext {
  initial: { x: number; y: number };
  current: { x: number; y: number };
  delta: { x: number; y: number };
}

export interface DraggableHandleProps extends HTMLAttributes<HTMLDivElement> {
  activationConstraint?: (ctx: DragHandleGestureContext) => boolean;
}
export type DraggableHandleActivationConstraint =
  DraggableHandleProps['activationConstraint'];

function DraggableHandle({
  children,
  activationConstraint,
}: DraggableHandleProps) {
  const setDragging = useDndStore((state) => state.setDragging);
  const setDragPosition = useDndStore((state) => state.setDragPosition);

  const draggable = useDraggableContext();
  const gestureContext = useRef<DragHandleGestureContext>({
    initial: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
  });

  const ref = useRef<HTMLDivElement>(null);
  useDrag(
    (state) => {
      // get this stuff out of the way.
      if (state.first) {
        console.debug('start drag gesture', draggable.id);
        gestureContext.current.initial.x = state.xy[0];
        gestureContext.current.initial.y = state.xy[1];
      }
      gestureContext.current.current.x = state.xy[0];
      gestureContext.current.current.y = state.xy[1];
      gestureContext.current.delta.x = state.movement[0];
      gestureContext.current.delta.y = state.movement[1];

      // If drag is over, end it
      if (state.last) {
        if (draggable.isDragged) {
          console.debug('end drag', draggable.id);
          useDndStore.getState().endDrag();
        }
        gestureContext.current.initial = { x: 0, y: 0 };
        gestureContext.current.current = { x: 0, y: 0 };
        gestureContext.current.delta = { x: 0, y: 0 };
        return;
      } else {
        // if not activated, check for activation
        if (!draggable.isDragged) {
          if (activationConstraint) {
            if (activationConstraint(gestureContext.current)) {
              console.debug('start drag (constraint passed)', draggable.id);
              setDragging(draggable, gestureContext.current.current);
            }
          } else {
            console.debug('start drag (no constraint)', draggable.id);
            // If no activation constraint is provided, we assume the drag should start
            setDragging(draggable, gestureContext.current.current);
          }
        } else {
          console.debug('dragging', draggable.id);
          // we are dragging this item
          setDragPosition(
            gestureContext.current.current.x,
            gestureContext.current.current.y,
          );
        }
      }
    },
    {
      target: ref,
    },
  );

  return (
    <motion.div style={{ touchAction: 'none' }} ref={ref}>
      {children}
    </motion.div>
  );
}

export const Draggable = Object.assign(DraggableRoot, {
  Handle: DraggableHandle,
});

interface DndOverlayPortalProps extends HTMLMotionProps<'div'> {
  enabled?: boolean;
  portaledFallback?: ReactNode;
}

/**
 * Selectively portals the dragged element to the overlay layer if it is being dragged.
 * Applies local (relative) movement to non-portaled content if any.
 */
function DndOverlayPortal({
  children,
  enabled,
  portaledFallback,
  ...rest
}: DndOverlayPortalProps) {
  const overlayEl = useDndStore((state) => state.overlayElement);
  const draggable = useDraggableContext();

  const isPortaling = enabled && !!overlayEl;

  return (
    <>
      {isPortaling &&
        createPortal(
          <DraggedRoot {...rest}>{children}</DraggedRoot>,
          overlayEl,
        )}
      <div className="relative">
        <motion.div
          style={{
            position: 'relative',
            x: draggable.localMovement.x,
            y: draggable.localMovement.y,
            // we have to keep this element in the DOM while the gesture
            // is active or it breaks. so just hide it...
            opacity: isPortaling ? 0 : 1,
          }}
          {...rest}
        >
          {children}
        </motion.div>
        {/* Show the fallback when main element is dragged if provided */}
        {isPortaling && portaledFallback && (
          <div className="absolute inset-0 pointer-events-none">
            {portaledFallback}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Animates the movement of the dragged object according to drag gesture.
 * Updates the position of the dragged box and checks for overlapping drop regions.
 * Applies primary overlapped region to the DnD store.
 */
function DraggedRoot({
  children,
  ref,
  style,
  ...rest
}: HTMLMotionProps<'div'>) {
  const dragMovement = useDraggedObjectMotionValues();

  useAnimationFrame(() => {
    if (draggedBox.current) {
      const overlapped = dropRegions.getOverlappingRegions(draggedBox.current);
      if (overlapped.length > 0) {
        useDndStore.getState().setOverRegion(overlapped[0].id);
      } else {
        useDndStore.getState().setOverRegion(null);
      }
    }
  });

  const finalRef = useMergedRef<HTMLDivElement>(draggedBox.bind, ref);

  return (
    <motion.div
      style={{
        ...style,
        position: 'absolute',
        x: dragMovement.x,
        y: dragMovement.y,
      }}
      ref={finalRef}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
