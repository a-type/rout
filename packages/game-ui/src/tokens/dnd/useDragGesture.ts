import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useElementEvent } from '../../hooks/useWindowEvent';
import { useDndStore } from './dndStore';
import { useDraggableContext } from './Draggable';
import { DraggedBox } from './draggedBox';
import { DragGestureContext, useGesture } from './gestureStore';

export interface DragGestureOptions {
  allowStartFromDragIn?: boolean;
  activationConstraint?: (ctx: DragGestureContext) => boolean;
}

export type DragGestureActivationConstraint =
  DragGestureOptions['activationConstraint'];

export function useDragGesture(options?: DragGestureOptions) {
  const draggable = useDraggableContext();
  const ref = useRef<HTMLDivElement>(null);

  // when the pointer enters our element, if a touch our mouse is down,
  // and no other element is dragging, that counts as beginning candidacy
  const startFromDragIn = !!options?.allowStartFromDragIn;

  const hasDragging = useDndStore((state) => !!state.dragging);
  const [isCandidate, setCandidate] = useDndStore(
    useShallow((state) => [
      state.candidate === draggable.id,
      state.setCandidate,
    ]),
  );
  const [isDragging, startDrag] = useDndStore(
    useShallow((state) => [state.dragging === draggable.id, state.startDrag]),
  );

  // when using touch, events are locked to the initial touched element,
  // so we can't detect a drag-in from another element by attaching to
  // the target element. we then have to manually hittest against this
  // element, unfortunately.
  const box = useState(() => new DraggedBox())[0];
  useEffect(() => {
    if (!startFromDragIn) return;
    return box.bind(ref.current);
  }, [ref, startFromDragIn, box]);

  function moveDrag(gesture: DragGestureContext) {
    // if this element is the dragging candidate
    if (isCandidate) {
      // check for activation constraint
      if (!isDragging) {
        if (options?.activationConstraint?.(gesture)) {
          activateDrag();
        }
      }
    } else if (startFromDragIn && !hasDragging) {
      console.debug('check drag-in', draggable.id);
      // else if this element is not related to the gesture,
      // let's see if we should claim it.
      // We use a heuristic to decide if a gesture which moves
      // over this element should start a drag.
      const containsGesture = box.contains(
        gesture.current.x.get(),
        gesture.current.y.get(),
      );

      if (!containsGesture) {
        // our element does not contain the gesture,
        // so we don't need to do anything.
        return;
      }

      if (!gesture.claimId) {
        // no other element has claim, we can take it without further checks
        beginDrag();
      } else {
        // first, we only want to claim the drag if the gesture is mostly
        // horizontal.
        const deltaX = gesture.delta.x.get();
        const deltaY = gesture.delta.y.get();
        const isMostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 2;
        if (!isMostlyHorizontal) {
          // if the gesture is not mostly horizontal, we don't claim it.
          return;
        }

        // based on the captured bounds of the prior gesture candidate,
        // we can decide if we are to the right or left of them, and only
        // claim the drag if the user's gesture velocity matches the direction.
        const velocityXSign = Math.sign(gesture.velocity.x.get());
        // for 0 velocity, don't claim.
        if (velocityXSign === 0) return;

        const xCenterOfPriorClaim =
          gesture.initialBounds.x + gesture.initialBounds.width / 2;
        const directionRelatedToPriorClaim = Math.sign(
          gesture.current.x.get() - xCenterOfPriorClaim,
        );

        if (directionRelatedToPriorClaim === velocityXSign) {
          beginDrag();
        }
      }
    }
  }

  const { claim } = useGesture({
    onMove: moveDrag,
  });

  function beginDrag() {
    const el = ref.current;
    if (!el) return;
    claim(draggable.id, el);

    if (!options?.activationConstraint) {
      return activateDrag();
    } else {
      setCandidate(draggable.id);
    }
  }

  function activateDrag() {
    console.debug('activateDrag', draggable.id);
    startDrag(draggable.id);
  }

  // when pointer down starts on our element, that marks it as the active
  // drag candidate
  useElementEvent(ref, 'pointerdown', beginDrag, { disabled: isCandidate });

  return {
    ref,
    isCandidate,
    isDragging,
  };
}

type InputEvent = PointerEvent | MouseEvent | TouchEvent;

function getEventCoordinates(ev: InputEvent): { x: number; y: number } {
  if (ev instanceof PointerEvent) {
    return { x: ev.clientX, y: ev.clientY };
  } else if (ev instanceof MouseEvent) {
    return { x: ev.clientX, y: ev.clientY };
  } else if (ev instanceof TouchEvent) {
    if (ev.touches.length > 0) {
      const touch = ev.touches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else if (ev.changedTouches.length > 0) {
      const touch = ev.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
  }
  return { x: 0, y: 0 };
}
