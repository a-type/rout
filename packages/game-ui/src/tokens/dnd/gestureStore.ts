import { useAnimationFrame, useStableCallback } from '@a-type/ui';
import { EventSubscriber } from '@a-type/utils';
import { MotionValue, motionValue } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useWindowEvent } from '../../hooks/useWindowEvent';
import { useDndStore } from './dndStore';
import { dropRegions } from './DropRegions';

export const gestureEvents = new EventSubscriber<{
  start: () => void;
  move: () => void;
  end: () => void;
  cancel: () => void;
}>();

export const gesture = {
  active: false,
  type: 'none' as 'touch' | 'mouse' | 'keyboard' | 'none',
  initial: { x: 0, y: 0 },
  claimId: null as string | null,
  initialBounds: { x: 0, y: 0, width: 0, height: 0 },
  offset: { x: 0, y: 0 },
  current: { x: motionValue(0), y: motionValue(0) },
  delta: { x: motionValue(0), y: motionValue(0) },
  velocity: { x: motionValue(0), y: motionValue(0) },
};

(window as any).gesture = gesture; // for debugging

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
    const coords = getEventCoordinates(event);
    applySubtraction(gesture.initial, coords, gesture.delta);
    applySubtraction(gesture.current, coords, gesture.velocity);
    setVector(gesture.current, coords.x, coords.y);

    // track overlapping regions
    const overlapped = dropRegions.getContainingRegions(coords);
    if (overlapped.length > 0) {
      useDndStore.getState().setOverRegion(overlapped[0].id);
    } else {
      useDndStore.getState().setOverRegion(null);
    }

    gestureEvents.emit('move');
  }

  function endGesture() {
    gesture.active = false;
    useDndStore.getState().endDrag(gesture);
    document.body.style.userSelect = '';

    gestureEvents.emit('end');
    resetGesture();
  }

  function cancelGesture() {
    gesture.active = false;
    useDndStore.getState().cancelDrag();
    document.body.style.userSelect = '';

    gestureEvents.emit('cancel');
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
  useWindowEvent(
    'pointermove',
    (ev) => {
      if (gesture.active && gesture.type !== 'keyboard') {
        moveGesture(ev);
      }
    },
    { capture: true },
  );
  useWindowEvent(
    'pointerup',
    () => {
      if (gesture.type !== 'keyboard') {
        endGesture();
      }
    },
    { capture: true },
  );
  useWindowEvent(
    'pointercancel',
    () => {
      if (gesture.type !== 'keyboard') {
        cancelGesture();
      }
    },
    { capture: true },
  );

  // keyboard controls
  useWindowEvent('keydown', (event) => {
    if (event.key === 'Escape') {
      cancelGesture();
    }
    if (gesture.active && gesture.type === 'keyboard') {
      if (event.key === 'Enter' || event.key === ' ') {
        endGesture();
      }
    }
  });

  const keyboardState = useState(() => new KeyboardState())[0];
  useEffect(() => keyboardState.bind(), [keyboardState]);
  useAnimationFrame(() => {
    for (const key of Object.keys(keyboardVectors)) {
      if (keyboardState.isPressed(key)) {
        const velocity = keyboardVectors[key as keyof typeof keyboardVectors];
        if (velocity) {
          const coord = getCurrentVector(gesture.current);
          coord.x += velocity.x;
          coord.y += velocity.y;
          setVector(gesture.velocity, velocity.x, velocity.y);
          setVector(gesture.current, coord.x, coord.y);
          applySubtraction(gesture.initial, gesture.current, gesture.delta);

          // track overlapping regions
          const overlapped = dropRegions.getContainingRegions(coord);
          if (overlapped.length > 0) {
            useDndStore.getState().setOverRegion(overlapped[0].id);
          } else {
            useDndStore.getState().setOverRegion(null);
          }

          gestureEvents.emit('move');
        }
      }
    }
  });
}

const keyboardVelocity = 10;
const keyboardVectors = {
  ArrowUp: { x: 0, y: -keyboardVelocity },
  ArrowDown: { x: 0, y: keyboardVelocity },
  ArrowLeft: { x: -keyboardVelocity, y: 0 },
  ArrowRight: { x: keyboardVelocity, y: 0 },
};

export function useGesture(
  callbacks: {
    onStart?: (gesture: DragGestureContext) => void;
    onMove?: (gesture: DragGestureContext) => void;
    onEnd?: (gesture: DragGestureContext) => void;
    onCancel?: (gesture: DragGestureContext) => void;
  },
  options: {
    disabled?: boolean;
  } = { disabled: false },
) {
  const onStart = useStableCallback(() => callbacks.onStart?.(gesture));
  const onMove = useStableCallback(() => callbacks.onMove?.(gesture));
  const onEnd = useStableCallback(() => callbacks.onEnd?.(gesture));
  const onCancel = useStableCallback(() => callbacks.onCancel?.(gesture));
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
  useEffect(() => {
    if (options.disabled) return;
    return gestureEvents.subscribe('cancel', onCancel);
  }, [onCancel, options.disabled]);

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

  const startKeyboardDrag = useCallback(
    (id: string, element: HTMLElement) => {
      gesture.claimId = id;
      setVector(gesture.offset, 0, 0);
      const elPosition = element?.getBoundingClientRect();
      if (elPosition) {
        gesture.initialBounds.x = elPosition.left;
        gesture.initialBounds.y = elPosition.top;
        gesture.initialBounds.width = elPosition.width;
        gesture.initialBounds.height = elPosition.height;

        setVector(
          gesture.current,
          elPosition.left + elPosition.width / 2,
          elPosition.top + elPosition.height / 2,
        );
        setVector(gesture.delta, 0, 0);
        setVector(gesture.velocity, 0, 0);
        gesture.initial.x = elPosition.left;
        gesture.initial.y = elPosition.top;
      }
      gesture.active = true;
      gesture.type = 'keyboard';
      document.body.style.userSelect = 'none';
      gestureEvents.emit('start');
    },
    [claim],
  );

  const cancelKeyboardDrag = useCallback(() => {
    document.body.style.userSelect = '';
    gestureEvents.emit('cancel');
    resetGesture();
  }, []);

  return {
    claim,
    startKeyboardDrag,
    cancelKeyboardDrag,
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

class KeyboardState {
  private keys: Set<string> = new Set();

  bind() {
    window.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('keyup', this.#onKeyUp);

    return () => {
      window.removeEventListener('keydown', this.#onKeyDown);
      window.removeEventListener('keyup', this.#onKeyUp);
    };
  }

  #onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.key);
  };
  #onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key);
  };

  isPressed(key: string): boolean {
    return this.keys.has(key);
  }
}
