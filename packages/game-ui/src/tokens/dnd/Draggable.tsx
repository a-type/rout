import {
  HTMLMotionProps,
  motion,
  MotionValue,
  useAnimationFrame,
  useMotionValue,
} from 'motion/react';
import { createContext, HTMLAttributes, ReactNode, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useMergedRef } from '../../hooks/useMergedRef';
import { useDraggedObjectMotionValues } from './animation';
import { useDndStore } from './dndStore';
import { draggedBox } from './draggedBox';
import { dropRegions } from './DropRegions';
import {
  DragGestureActivationConstraint,
  useDragGesture,
} from './useDragGesture';

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

export interface DraggableHandleProps extends HTMLAttributes<HTMLDivElement> {
  activationConstraint?: DragGestureActivationConstraint;
  allowStartFromDragIn?: boolean;
}
function DraggableHandle({
  children,
  activationConstraint,
  allowStartFromDragIn = false,
}: DraggableHandleProps) {
  const draggable = useDraggableContext();

  const { ref } = useDragGesture(draggable, {
    activationConstraint,
    allowStartFromDragIn,
  });

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
            // x: draggable.localMovement.x,
            // y: draggable.localMovement.y,
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
