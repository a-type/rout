import { clsx } from '@a-type/ui';
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  Transition,
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

  return (
    <DraggableContext.Provider
      value={{
        id,
        data,
        isDragged,
        isCandidate,
        disabled,
      }}
    >
      <DndOverlayPortal enabled={isDragged || isCandidate} {...rest}>
        {children}
      </DndOverlayPortal>
    </DraggableContext.Provider>
  );
}

export interface DraggableContextValue {
  id: string;
  data: any;
  isDragged: boolean;
  isCandidate: boolean;
  disabled: boolean;
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

export interface DraggableHandleProps extends HTMLAttributes<HTMLDivElement> {
  activationConstraint?: DragGestureActivationConstraint;
  allowStartFromDragIn?: boolean;
}
function DraggableHandle({
  children,
  activationConstraint,
  allowStartFromDragIn = false,
}: DraggableHandleProps) {
  const { ref, isCandidate, disabled } = useDragGesture({
    activationConstraint,
    allowStartFromDragIn,
  });

  return (
    <motion.div
      style={{
        touchAction: disabled ? 'initial' : 'none',
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
  /**
   * Override the component that implements the rendering of the dragged element.
   * This lets you customize how dragged items animate and appear.
   * Default just renders the contents snapped to the center of the cursor and
   * makes adjustments on touch to avoid the user's finger.
   */
  DraggedContainer?: DraggedContainerComponent;
}

const flipTransition: Transition = { duration: 0.1, ease: 'easeInOut' };

/**
 * Selectively portals the dragged element to the overlay layer if it is being dragged.
 * Applies local (relative) movement to non-portaled content if any.
 */
function DndOverlayPortal({
  children,
  enabled,
  DraggedContainer,
  ...rest
}: DndOverlayPortalProps) {
  const draggable = useDraggableContext();
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
      <div className={clsx(isPortaling && 'invisible')}>
        <AnimatePresence>
          <motion.div
            layoutId={draggable.id}
            transition={flipTransition}
            data-disabled={draggable.disabled}
            data-draggable={draggable.id}
            {...rest}
          >
            {children}
          </motion.div>
        </AnimatePresence>
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
    <ContainerImpl
      ref={finalRef}
      draggable={dragged}
      gesture={gesture}
      {...rest}
    >
      <AnimatePresence>
        <motion.div
          layoutId={dragged.id}
          transition={flipTransition}
          data-draggable-preview={dragged.id}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ContainerImpl>
  );
}

export type DraggedContainerComponent = ComponentType<{
  children?: ReactNode;
  draggable: DraggableContextValue;
  gesture: DragGestureContext;
  ref: Ref<HTMLDivElement>;
}>;

export const DefaultDraggedContainer: DraggedContainerComponent = ({
  children,
  ref,
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
    >
      {children}
    </motion.div>
  );
};

export function useCenteredDragTransform(gesture: DragGestureContext) {
  const { x, y } = gesture.current;
  const touchAdjustedY = useTransform(() => {
    console.log(y.get());
    return y.get() + (gesture.type === 'touch' ? -40 : 0);
  });
  const transform = useMotionTemplate`translate(-50%, -50%) translate3d(${x}px, ${touchAdjustedY}px, 0)`;
  return transform;
}
