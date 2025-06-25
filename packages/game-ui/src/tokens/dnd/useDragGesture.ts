import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useElementEvent } from '../../hooks/useWindowEvent';
import { otherDragBoxRefs } from './DebugView';
import { useDndStore } from './dndStore';
import { useDraggableContext } from './Draggable';
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
  const [isDragging, startDrag, cancelDrag] = useDndStore(
    useShallow((state) => [
      state.dragging === draggable.id,
      state.startDrag,
      state.cancelDrag,
    ]),
  );

  useEffect(() => {
    otherDragBoxRefs.add(draggable);
    return () => {
      otherDragBoxRefs.delete(draggable);
    };
  }, [draggable]);

  // when using touch, events are locked to the initial touched element,
  // so we can't detect a drag-in from another element by attaching to
  // the target element. we then have to manually hittest against this
  // element, unfortunately.
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
      draggable.box.update();
      // else if this element is not related to the gesture,
      // let's see if we should claim it.
      // We use a heuristic to decide if a gesture which moves
      // over this element should start a drag.
      const containsGesture = draggable.box.contains(
        gesture.currentRaw.x,
        gesture.currentRaw.y,
      );

      if (!containsGesture) {
        // our element does not contain the gesture,
        // so we don't need to do anything.
        return;
      }

      if (!gesture.claimId) {
        // drag-in gestures must always start from a valid, claimed gesture started
        // with a standard pointer-down.
        return;
      } else {
        // first, we only want to claim the drag if the gesture is mostly
        // horizontal.
        const deltaX = gesture.delta.x.get();
        const deltaY = gesture.delta.y.get();
        const isMostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
        if (!isMostlyHorizontal) {
          // if the gesture is not mostly horizontal, we don't claim it.
          return;
        }

        // based on the captured bounds of the prior gesture candidate,
        // we can decide if we are to the right or left of them, and only
        // claim the drag if the user's gesture velocity matches the direction.
        const velocityXSign = Math.sign(gesture.velocity.x.get());
        // for 0 velocity, don't claim.
        if (velocityXSign === 0) {
          return;
        }

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

  const { claim, startKeyboardDrag } = useGesture(
    {
      onMove: moveDrag,
      onCancel: (gesture) => {
        if (gesture.type === 'keyboard' && isDragging) {
          // when we cancel a drag with the keyboard,
          // return focus to the element once it's back in place.
          setTimeout(() => {
            ref.current?.focus();
          }, 100);
        }
        document.body.classList.remove('cursor-grabbing');
        draggable.box.update();
      },
      onEnd: (gesture) => {
        if (gesture.type === 'keyboard') {
          // when we end a drag with the keyboard,
          // return focus to the element once it's back in place.
          setTimeout(() => {
            const el = ref.current;
            if (el && el.tabIndex >= 0) {
              el.focus();
            }
          }, 100);
        }
        document.body.classList.remove('cursor-grabbing');
        cancelDrag();
        draggable.box.update();
      },
    },
    {
      disabled: draggable.disabled,
    },
  );

  function beginDrag() {
    const el = ref.current;
    if (!el) return;
    claim(draggable.id, el);
    document.body.classList.add('cursor-grabbing');

    if (!options?.activationConstraint) {
      return activateDrag();
    } else {
      setCandidate(draggable.id);
    }
  }

  function activateDrag() {
    startDrag(draggable.id);
  }

  // when pointer down starts on our element, that marks it as the active
  // drag candidate
  useElementEvent(ref, 'pointerdown', beginDrag, {
    disabled: isCandidate || draggable.disabled,
  });

  // detect keyboard drag from Enter/Space key
  useElementEvent(
    ref,
    'keypress',
    (ev: KeyboardEvent) => {
      if (!ref.current) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        ev.stopPropagation();
        startKeyboardDrag(draggable.id, ref.current);
        activateDrag();
      }
    },
    {
      disabled: isCandidate || isDragging || draggable.disabled,
    },
  );

  return {
    ref,
    isCandidate,
    isDragging,
    disabled: draggable.disabled,
  };
}
