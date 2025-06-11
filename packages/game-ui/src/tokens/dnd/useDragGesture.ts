import { MotionValue, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useElementEvent, useWindowEvent } from '../../hooks/useWindowEvent';
import { dndEvents } from './dndEvents';
import { useDndStore } from './dndStore';
import { DragGestureContext, useDraggableContext } from './Draggable';
import { DraggedBox } from './draggedBox';

export interface DragGestureOptions {
  allowStartFromDragIn?: boolean;
  activationConstraint?: (ctx: DragGestureContext) => boolean;
}

export type DragGestureActivationConstraint =
  DragGestureOptions['activationConstraint'];

export function useDragGesture(options?: DragGestureOptions) {
  const draggable = useDraggableContext();
  const ref = useRef<HTMLDivElement>(null);

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

  const monitorGlobalEvents = isCandidate || isDragging;

  function resetGestureState() {
    console.debug('resetGestureState', draggable.id);
    setVector(draggable.gesture.current, 0, 0);
    setVector(draggable.gesture.delta, 0, 0);
    setVector(draggable.gesture.velocity, 0, 0);
    setVector(draggable.gesture.initial, 0, 0);
    setVector(draggable.gesture.offset, 0, 0);
    draggable.gesture.type = 'none';
  }

  function beginDrag(ev: InputEvent) {
    const coordinate = getEventCoordinates(ev);
    console.debug('beginDrag', draggable.id, coordinate);
    setVector(draggable.gesture.initial, coordinate.x, coordinate.y);
    setVector(draggable.gesture.current, coordinate.x, coordinate.y);
    setVector(draggable.gesture.delta, 0, 0);
    setVector(draggable.gesture.velocity, 0, 0);
    draggable.gesture.type = isTouchEvent(ev) ? 'touch' : 'mouse';

    // get pointer offset within element bounds
    const el = ref.current;
    const elPosition = el?.getBoundingClientRect();
    const { x, y } = coordinate;
    const xOffset = elPosition ? x - elPosition.left : 0;
    const yOffset = elPosition ? y - elPosition.top : 0;
    setVector(draggable.gesture.offset, xOffset, yOffset);

    if (!options?.activationConstraint) {
      return activateDrag(ev);
    } else {
      setCandidate(draggable.id);
    }
  }

  function activateDrag(ev: InputEvent) {
    console.debug('activateDrag', draggable.id);
    startDrag(draggable.id);
  }

  function moveDrag(ev: InputEvent) {
    // update gesture state
    const coords = getEventCoordinates(ev);

    console.debug('moveDrag', draggable.id);
    applySubtraction(
      draggable.gesture.initial,
      coords,
      draggable.gesture.delta,
    );
    applySubtraction(
      draggable.gesture.current,
      coords,
      draggable.gesture.velocity,
    );
    setVector(draggable.gesture.current, coords.x, coords.y);

    // check for activation constraint
    if (isCandidate && !isDragging) {
      if (options?.activationConstraint?.(draggable.gesture)) {
        activateDrag(ev);
      }
    }
  }

  function endDrag(ev: InputEvent) {
    console.debug('endDrag', draggable.id);
    // end the drag
    useDndStore.getState().endDrag();
  }

  // we attach these to window so we don't lose them
  useWindowEvent('pointermove', moveDrag, { disabled: !monitorGlobalEvents });
  useWindowEvent('pointerup', endDrag, { disabled: !monitorGlobalEvents });
  useWindowEvent('pointercancel', endDrag, { disabled: !monitorGlobalEvents });

  // when pointer down starts on our element, that marks it as the active
  // drag candidate
  useElementEvent(ref, 'pointerdown', beginDrag, { disabled: isCandidate });

  // when the pointer enters our element, if a touch our mouse is down,
  // and no other element is dragging, that counts as beginning candidacy
  const startFromDragIn = !!options?.allowStartFromDragIn;
  useElementEvent(
    ref,
    'pointerover',
    (ev) => {
      if (ev.buttons > 0 && !hasDragging) {
        console.log('pointerover begindrag');
        beginDrag(ev);
      }
    },
    { disabled: !startFromDragIn || isCandidate || hasDragging },
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
  useWindowEvent(
    'touchmove',
    (ev) => {
      const position = getEventCoordinates(ev);
      if (box.contains(position.x, position.y)) {
        console.log('touchmove begindrag');
        beginDrag(ev);
      }
    },
    {
      disabled: !startFromDragIn || isCandidate || hasDragging,
    },
  );

  useEffect(
    () =>
      dndEvents.subscribe('cancel', (cancelled) => {
        if (draggable.id === cancelled) {
          resetGestureState();
        }
      }),
    [draggable],
  );

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

type VectorLike =
  | { x: number; y: number }
  | { x: MotionValue<number>; y: MotionValue<number> };

function getCurrentVector(v: VectorLike): { x: number; y: number } {
  if (v.x instanceof MotionValue && v.y instanceof MotionValue) {
    return { x: v.x.get(), y: v.y.get() };
  } else {
    return { x: v.x as number, y: v.y as number };
  }
}

function setVector(v: VectorLike, x: number, y: number) {
  if (v.x instanceof MotionValue && v.y instanceof MotionValue) {
    v.x.set(x);
    v.y.set(y);
  } else {
    v.x = x;
    v.y = y;
  }
}

function applySubtraction(a: VectorLike, b: VectorLike, target: VectorLike) {
  const aCurrent = getCurrentVector(a);
  const bCurrent = getCurrentVector(b);
  const x = bCurrent.x - aCurrent.x;
  const y = bCurrent.y - aCurrent.y;
  setVector(target, x, y);
}

export function useInitialDragGesture(): DragGestureContext {
  const initialRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const deltaX = useMotionValue(0);
  const deltaY = useMotionValue(0);
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);
  return useRef({
    initial: initialRef.current,
    offset: offsetRef.current,
    current: { x, y },
    delta: { x: deltaX, y: deltaY },
    velocity: { x: velocityX, y: velocityY },
    type: 'none' as const,
  }).current;
}

function isTouchEvent(event: InputEvent): event is TouchEvent {
  return (
    event instanceof TouchEvent ||
    (event as PointerEvent).pointerType === 'touch'
  );
}
