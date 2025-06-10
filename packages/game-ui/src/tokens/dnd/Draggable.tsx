import {
  HTMLMotionProps,
  motion,
  MotionValue,
  useAnimationFrame,
  useMotionTemplate,
  useTransform,
} from 'motion/react';
import {
  ComponentType,
  createContext,
  HTMLAttributes,
  ReactNode,
  Ref,
  useContext,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { useMergedRef } from '../../hooks/useMergedRef';
import { useDndStore } from './dndStore';
import { draggedBox } from './draggedBox';
import { dropRegions } from './DropRegions';
import {
  DragGestureActivationConstraint,
  useDragGesture,
  useInitialDragGesture,
} from './useDragGesture';

export interface DraggableProps extends HTMLMotionProps<'div'> {
  id: string;
  data?: any;
  disabled?: boolean;
  draggingPlaceholder?: ReactNode;
  children?: ReactNode;
  DraggedContainer?: DraggedContainerComponent;
}

function DraggableRoot({
  id,
  data,
  disabled,
  children,
  draggingPlaceholder,
  ...rest
}: DraggableProps) {
  const isDragged = useDndStore((state) => state.dragging === id);
  const isCandidate = useDndStore((state) => state.candidate === id);
  const gesture = useInitialDragGesture();

  const bindData = useDndStore((state) => state.bindData);
  // necessary for multiple concurrent draggables not to clobber...
  // TODO: simplify...
  const hasBoundData = useDndStore((state) => !!state.data[id]);
  const needsRebind = !!data && !hasBoundData;
  useEffect(() => bindData(id, data), [id, data, bindData, needsRebind]);

  return (
    <DraggableContext.Provider
      value={{
        id,
        data,
        isDragged,
        isCandidate,
        gesture,
      }}
    >
      <DndOverlayPortal
        portaledFallback={draggingPlaceholder}
        enabled={isDragged || isCandidate}
        {...rest}
      >
        {children}
      </DndOverlayPortal>
    </DraggableContext.Provider>
  );
}

export interface DragGestureContext {
  initial: { x: number; y: number };
  offset: { x: number; y: number };
  current: { x: MotionValue<number>; y: MotionValue<number> };
  delta: { x: MotionValue<number>; y: MotionValue<number> };
  velocity: { x: MotionValue<number>; y: MotionValue<number> };
  type: 'touch' | 'mouse' | 'none';
}

export interface DraggableContextValue {
  id: string;
  data: any;
  isDragged: boolean;
  isCandidate: boolean;
  gesture: DragGestureContext;
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

export interface DraggableHandleProps extends HTMLAttributes<HTMLDivElement> {
  activationConstraint?: DragGestureActivationConstraint;
  allowStartFromDragIn?: boolean;
}
function DraggableHandle({
  children,
  activationConstraint,
  allowStartFromDragIn = false,
}: DraggableHandleProps) {
  const { ref, isCandidate } = useDragGesture({
    activationConstraint,
    allowStartFromDragIn,
  });

  return (
    <motion.div
      style={{
        touchAction: 'none',
        pointerEvents: isCandidate ? 'none' : 'auto',
      }}
      onContextMenu={(e) => e.preventDefault()}
      ref={ref}
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
  portaledFallback?: ReactNode;
  /**
   * Override the component that implements the rendering of the dragged element.
   * This lets you customize how dragged items animate and appear.
   * Default just renders the contents snapped to the center of the cursor and
   * makes adjustments on touch to avoid the user's finger.
   */
  DraggedContainer?: DraggedContainerComponent;
}

/**
 * Selectively portals the dragged element to the overlay layer if it is being dragged.
 * Applies local (relative) movement to non-portaled content if any.
 */
function DndOverlayPortal({
  children,
  enabled,
  portaledFallback,
  DraggedContainer,
  ...rest
}: DndOverlayPortalProps) {
  const overlayEl = useDndStore((state) => state.overlayElement);

  const isPortaling = enabled && !!overlayEl;

  return (
    <>
      {isPortaling &&
        createPortal(
          <DraggedRoot Container={DraggedContainer} {...rest}>
            {children}
          </DraggedRoot>,
          overlayEl,
        )}
      <div className="relative">
        <motion.div
          style={{
            position: 'relative',
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
  Container: UserContainer,
  ...rest
}: Omit<HTMLMotionProps<'div'>, 'draggable'> & {
  Container?: DraggedContainerComponent;
  children: ReactNode;
}) {
  const dragged = useDraggableContext();

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

  const ContainerImpl = UserContainer || DefaultDraggedContainer;

  return (
    <ContainerImpl ref={finalRef} draggable={dragged} {...rest}>
      {children}
    </ContainerImpl>
  );
}

export type DraggedContainerComponent = ComponentType<{
  children?: ReactNode;
  draggable: DraggableContextValue;
  ref: Ref<HTMLDivElement>;
}>;

const DefaultDraggedContainer: DraggedContainerComponent = ({
  children,
  draggable,
  ref,
}) => {
  const transform = useCenteredDragTransform(draggable);
  return (
    <motion.div
      style={{
        position: 'absolute',
        transform,
      }}
      ref={ref}
    >
      {children}
    </motion.div>
  );
};

export function useCenteredDragTransform(draggable: DraggableContextValue) {
  const { x, y } = draggable.gesture.current;
  const touchAdjustedY = useTransform(
    () => y.get() + (draggable.gesture.type === 'touch' ? -40 : 0),
  );
  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${x}px, ${touchAdjustedY}px, 0)`;
  return transform;
}
