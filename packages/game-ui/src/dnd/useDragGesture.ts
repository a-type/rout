import { useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useElementEvent } from '../hooks/useWindowEvent.js';
import { boundsRegistry } from './bounds.js';
import { useDndStore } from './dndStore.js';
import { useDraggableContext } from './Draggable.js';
import { useParentDroppable } from './Droppable.js';
import {
  DragGestureContext,
  gesture,
  setVector,
  useGesture,
} from './gestureStore.js';
import { dndLogger } from './logger.js';

export interface DragGestureOptions {
  allowStartFromDragIn?: boolean;
  activationConstraint?: (ctx: DragGestureContext) => boolean;
  touchOffset?: number;
  onTap?: () => void;
  dropOnTag?: string;
}

export type DragGestureActivationConstraint =
  DragGestureOptions['activationConstraint'];

const tmpVec = { x: 0, y: 0 };

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
          dndLogger.debug(
            `Activation constraint passed for ${draggable.id}, activating drag`,
          );
          activateDrag();
        }
      }
    } else if (startFromDragIn && !hasDragging) {
      // else if this element is not related to the gesture,
      // let's see if we should claim it.
      // We use a heuristic to decide if a gesture which moves
      // over this element should start a drag.
      // FIXME: remove need to subtract offset here
      tmpVec.x = gesture.currentRaw.x - gesture.offset.x;
      tmpVec.y = gesture.currentRaw.y - gesture.offset.y;
      const containsGesture = boundsRegistry.entryContainsPoint(
        draggable.id,
        tmpVec,
      );

      if (!containsGesture) {
        // our element does not contain the gesture,
        // so we don't need to do anything.
        return;
      }

      if (!gesture.claimId) {
        // drag-in gestures must always start from a valid, claimed gesture started
        // with a standard pointer-down.
        dndLogger.debug(
          draggable.id,
          'Not claiming drag-in because there is no active gesture claim',
        );
        return;
      } else {
        // first, we only want to claim the drag if the gesture is mostly
        // horizontal.
        const deltaX = gesture.delta.x.get();
        const deltaY = gesture.delta.y.get();
        const isMostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
        if (!isMostlyHorizontal) {
          // if the gesture is not mostly horizontal, we don't claim it.
          dndLogger.debug(
            draggable.id,
            'Not claiming drag-in because gesture is not mostly horizontal',
          );
          return;
        }

        // based on the captured bounds of the prior gesture candidate,
        // we can decide if we are to the right or left of them, and only
        // claim the drag if the user's gesture velocity matches the direction.
        const velocityXSign = Math.sign(gesture.velocity.x.get());
        // for 0 velocity, don't claim.
        if (velocityXSign === 0) {
          dndLogger.debug(
            'Not claiming drag-in because gesture has no horizontal velocity',
          );
          return;
        }

        const xCenterOfPriorClaim =
          gesture.initialBounds.x + gesture.initialBounds.width / 2;
        const directionRelatedToPriorClaim = Math.sign(
          gesture.current.x.get() - xCenterOfPriorClaim,
        );

        if (directionRelatedToPriorClaim === -velocityXSign) {
          beginDrag();
        } else {
          dndLogger.debug(
            draggable.id,
            'Not claiming drag-in because gesture is moving in the opposite direction of the prior drag',
          );
        }
      }
    }
  }

  const parentId = useParentDroppable();
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
      },
      onEnd: (gesture) => {
        if (gesture.type === 'keyboard' && isDragging) {
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

        if (isDragging || isCandidate) {
          if (
            Math.sqrt(
              gesture.totalMovement.x ** 2 + gesture.totalMovement.y ** 2,
            ) < 10
          ) {
            // if the drag was very small, we consider it a tap.
            options?.onTap?.();
          }
        }
      },
    },
    {
      disabled: draggable.disabled,
    },
  );

  function beginDrag() {
    const el = ref.current;
    if (!el) return;
    claim(draggable.id, el, {
      targetTag: options?.dropOnTag,
      droppableParentId: parentId,
    });
    document.body.classList.add('cursor-grabbing');
    if (gesture.type === 'touch' && options?.touchOffset) {
      setVector(gesture.offset, 0, options.touchOffset);
    }

    if (!options?.activationConstraint) {
      dndLogger.debug(
        `No activation constraint, activating drag immediately for ${draggable.id}`,
      );
      return activateDrag();
    } else {
      dndLogger.debug(
        `Activation constraint present, waiting for activation for ${draggable.id} (it is the candidate now)`,
      );
      setCandidate(draggable.id);
      gesture.draggedFrom = parentId;
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
        startKeyboardDrag(draggable.id, ref.current, {
          targetTag: options?.dropOnTag,
          droppableParentId: parentId,
        });
        dndLogger.debug(`Keyboard drag activated for ${draggable.id}`);
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
