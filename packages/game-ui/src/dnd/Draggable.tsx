import { clsx } from '@a-type/ui';
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  MotionProps,
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
} from 'react';
import { createPortal } from 'react-dom';
import { useMergedRef } from '../hooks/useMergedRef.js';
import { useBindBounds, useTagBounds } from './bounds.js';
import { draggableDataRegistry } from './dataRegistry.js';
import { useDndStore } from './dndStore.js';
import { DragGestureContext, gesture } from './gestureStore.js';
import { TAGS } from './tags.js';
import { flipTransition } from './transitions.js';
import {
  DragGestureActivationConstraint,
  useDragGesture,
} from './useDragGesture.js';

export interface DraggableProps extends HTMLMotionProps<'div'> {
  id: string;
  data?: any;
  disabled?: boolean;
  children?: ReactNode;
  DraggedContainer?: DraggedContainerComponent;
  draggedClassName?: string;
  noHandle?: boolean;
  handleProps?: DraggableHandleProps;
  movedBehavior?: 'remove' | 'fade';
  tags?: string[];
  dropOnTag?: string;
  svg?: boolean;
}

function DraggableRoot({
  id,
  data,
  disabled = false,
  noHandle = false,
  children,
  handleProps,
  tags,
  dropOnTag = TAGS.DROPPABLE,
  svg = false,
  ...rest
}: DraggableProps) {
  const { isDragged, isCandidate, ctxValue } = useDraggableRoot({
    id,
    data,
    disabled,
    dropOnTag,
    svg,
  });

  return (
    <DraggableContext.Provider value={ctxValue}>
      <DndOverlayPortal
        enabled={isDragged || isCandidate}
        dragDisabled={disabled}
        id={id}
        tags={tags}
        {...rest}
      >
        <ConditionalHandle disabled={noHandle} {...handleProps}>
          {children}
        </ConditionalHandle>
      </DndOverlayPortal>
    </DraggableContext.Provider>
  );
}

function useDraggableRoot({
  id,
  data,
  disabled,
  dropOnTag,
  svg,
}: {
  id: string;
  data?: any;
  disabled: boolean;
  dropOnTag: string;
  svg: boolean;
}) {
  const isDragged = useDndStore((state) => state.dragging === id);
  const isCandidate = useDndStore((state) => state.candidate === id);

  useEffect(() => draggableDataRegistry.register(id, data), [id, data]);

  const ctxValue = useMemo(
    () => ({
      id,
      data,
      disabled,
      dropOnTag,
      svg,
    }),
    [id, disabled, dropOnTag, svg],
  );

  return { isDragged, isCandidate, ctxValue };
}

export interface DraggableContextValue {
  id: string;
  disabled: boolean;
  dropOnTag: string;
  svg: boolean;
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

function DragMotion(
  props: MotionProps & { ref?: Ref<any>; className?: string },
) {
  const { svg } = useDraggableContext();
  if (svg) {
    return <motion.g {...props} />;
  }
  return <motion.div {...props} />;
}

export interface DraggableHandleProps
  extends Omit<HTMLMotionProps<'div'>, 'onTap'> {
  activationConstraint?: DragGestureActivationConstraint;
  allowStartFromDragIn?: boolean;
  touchOffset?: number; // Y offset for touch gestures, default is -40px
  onTap?: () => void;
}

const allowDragInTags = [TAGS.DRAG_INTERACTIVE];
function DraggableHandle({
  children,
  activationConstraint,
  allowStartFromDragIn = false,
  className,
  touchOffset,
  ref: userRef,
  onTap,
  ...rest
}: DraggableHandleProps) {
  const { id, dropOnTag, svg } = useDraggableContext();
  const { ref, isCandidate, isDragging, disabled } = useDragGesture({
    activationConstraint,
    allowStartFromDragIn,
    touchOffset,
    onTap,
    dropOnTag,
  });

  const finalRef = useMergedRef<HTMLDivElement>(ref, userRef);

  useTagBounds(id, allowDragInTags, !allowStartFromDragIn);

  return (
    <DragMotion
      style={{
        touchAction: disabled ? 'initial' : 'none',
        pointerEvents: isCandidate ? 'none' : 'auto',
      }}
      onContextMenuCapture={
        disabled
          ? undefined
          : (((e: Event) => {
              e.preventDefault();
              e.stopPropagation();
            }) as any)
      }
      ref={finalRef}
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
    </DragMotion>
  );
}

const ConditionalHandle = ({
  disabled,
  children,
  ...rest
}: { disabled?: boolean } & DraggableHandleProps) => {
  if (disabled) {
    return <>{children}</>;
  }
  return (
    <DraggableHandle className="w-full h-full" {...rest}>
      {children}
    </DraggableHandle>
  );
};

export const Draggable = Object.assign(DraggableRoot, {
  Handle: DraggableHandle,
  ConditionalHandle,
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
  movedBehavior?: DraggableProps['movedBehavior'];
  tags?: string[];
}

const defaultTags = [TAGS.DRAGGABLE];
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
  movedBehavior = 'remove',
  ref,
  tags = defaultTags,
  ...rest
}: DndOverlayPortalProps) {
  const { svg } = useDraggableContext();
  const overlayEl = useDndStore((state) =>
    svg ? state.svgOverlayElement : state.domOverlayElement,
  );

  const isPortaling = enabled && !!overlayEl;

  const bindBounds = useBindBounds(id);
  useTagBounds(id, tags);
  const mainRef = useMergedRef<HTMLDivElement>(
    ref,
    dragDisabled ? undefined : bindBounds,
  );

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
      <DragMotion
        layoutId={isPortaling ? undefined : id}
        key={`${id}-${isPortaling}`}
        transition={flipTransition}
        data-disabled={dragDisabled}
        data-draggable={id}
        data-is-moved={isPortaling}
        ref={mainRef}
        className={className}
        animate={{
          width: isPortaling && movedBehavior === 'remove' ? 0 : 'auto',
        }}
        style={{
          opacity: isPortaling ? (movedBehavior === 'remove' ? 0 : 0.5) : 1,
          position:
            isPortaling && movedBehavior === 'remove' ? 'absolute' : undefined,
        }}
        {...rest}
      >
        {children}
      </DragMotion>
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
          <DragMotion
            layoutId={dragged.id}
            transition={flipTransition}
            data-draggable-preview
            data-draggable-preview-id={dragged.id}
            data-disabled={dragged.disabled}
          >
            {children}
          </DragMotion>
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
    <DragMotion
      style={{
        position: 'absolute',
        transform,
        zIndex: 1000000,
      }}
      ref={ref}
      className={className}
    >
      {children}
    </DragMotion>
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
