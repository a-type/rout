import { useStableCallback } from '@a-type/ui';
import { EventSubscriber } from '@a-type/utils';
import { MotionValue, motionValue } from 'motion/react';
import { useCallback, useEffect } from 'react';
import { useWindowEvent } from '../../hooks/useWindowEvent';
import { useDndStore } from './dndStore';

const gestureEvents = new EventSubscriber<{
  start: () => void;
  move: () => void;
  end: () => void;
}>();

export const gesture = {
  active: false,
  type: 'none' as 'touch' | 'mouse' | 'none',
  initial: { x: 0, y: 0 },
  claimId: null as string | null,
  initialBounds: { x: 0, y: 0, width: 0, height: 0 },
  offset: { x: 0, y: 0 },
  current: { x: motionValue(0), y: motionValue(0) },
  delta: { x: motionValue(0), y: motionValue(0) },
  velocity: { x: motionValue(0), y: motionValue(0) },
};

export function resetGesture() {
  gesture.active = false;
  gesture.type = 'none';
  gesture.claimId = null;
  setVector(gesture.current, 0, 0);
  setVector(gesture.delta, 0, 0);
  setVector(gesture.velocity, 0, 0);
  setVector(gesture.offset, 0, 0);
  gesture.initialBounds.x = 0;
  gesture.initialBounds.y = 0;
  gesture.initialBounds.width = 0;
  gesture.initialBounds.height = 0;
}

export type DragGestureContext = typeof gesture;

type GestureEvent = PointerEvent | MouseEvent | TouchEvent;

export function useMonitorGlobalGesture() {
  function startGesture(event: GestureEvent) {
    gesture.active = true;
    const coordinate = getEventCoordinates(event);
    gesture.type = isTouchEvent(event) ? 'touch' : 'mouse';
    setVector(gesture.initial, coordinate.x, coordinate.y);
    setVector(gesture.current, coordinate.x, coordinate.y);
    setVector(gesture.delta, 0, 0);
    setVector(gesture.velocity, 0, 0);
    setVector(gesture.offset, 0, 0);
    gesture.initialBounds.x = 0;
    gesture.initialBounds.y = 0;
    gesture.initialBounds.width = 0;
    gesture.initialBounds.height = 0;

    gestureEvents.emit('start');
  }

  function moveGesture(event: GestureEvent) {
    if (!gesture.active) return;

    const coords = getEventCoordinates(event);
    applySubtraction(gesture.initial, coords, gesture.delta);
    applySubtraction(gesture.current, coords, gesture.velocity);
    setVector(gesture.current, coords.x, coords.y);

    gestureEvents.emit('move');
  }

  function endGesture() {
    gesture.active = false;
    useDndStore.getState().endDrag(gesture);
    document.body.style.userSelect = '';

    gestureEvents.emit('end');
    resetGesture();
  }

  useWindowEvent(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      startGesture(event);
    },
    { capture: true },
  );
  useWindowEvent('pointermove', moveGesture, { capture: true });
  useWindowEvent('pointerup', endGesture, { capture: true });
  useWindowEvent('pointercancel', endGesture, { capture: true });
}

export function useGesture(
  callbacks: {
    onStart?: (gesture: DragGestureContext) => void;
    onMove?: (gesture: DragGestureContext) => void;
    onEnd?: (gesture: DragGestureContext) => void;
  },
  options: {
    disabled?: boolean;
  } = { disabled: false },
) {
  const onStart = useStableCallback(() => callbacks.onStart?.(gesture));
  const onMove = useStableCallback(() => callbacks.onMove?.(gesture));
  const onEnd = useStableCallback(() => callbacks.onEnd?.(gesture));
  useEffect(() => {
    if (options.disabled) return;
    return gestureEvents.subscribe('start', onStart);
  }, [onStart, options.disabled]);
  useEffect(() => {
    if (options.disabled) return;
    return gestureEvents.subscribe('move', onMove);
  }, [onMove, options.disabled]);
  useEffect(() => {
    if (options.disabled) return;
    return gestureEvents.subscribe('end', onEnd);
  }, [onEnd, options.disabled]);

  const claim = useCallback((id: string, element: HTMLElement) => {
    // cancel any existing text selection and prevent text selection globally
    document.body.style.userSelect = 'none';

    gesture.claimId = id;
    const elPosition = element?.getBoundingClientRect();
    const { x, y } = getCurrentVector(gesture.current);
    const xOffset = elPosition ? x - elPosition.left : 0;
    const yOffset = elPosition ? y - elPosition.top : 0;
    setVector(gesture.offset, xOffset, yOffset);
    if (elPosition) {
      gesture.initialBounds.x = elPosition.left;
      gesture.initialBounds.y = elPosition.top;
      gesture.initialBounds.width = elPosition.width;
      gesture.initialBounds.height = elPosition.height;
    }
  }, []);
  return {
    claim,
  };
}

function getEventCoordinates(ev: GestureEvent): { x: number; y: number } {
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

function isTouchEvent(event: GestureEvent): event is TouchEvent {
  return (
    event instanceof TouchEvent ||
    (event as PointerEvent).pointerType === 'touch'
  );
}
