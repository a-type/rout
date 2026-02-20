import { useAnimationFrame, useStableCallback } from '@a-type/ui';
import { MotionValue, motionValue } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useWindowEvent } from '../hooks/useWindowEvent.js';
import { boundsRegistry } from './bounds.js';
import { useDndStore } from './dndStore.js';
import { gestureEvents } from './gestureEvents.js';
import { dndLogger } from './logger.js';
import { TAGS } from './tags.js';

export const gesture = {
  active: false,
  type: 'none' as 'touch' | 'mouse' | 'keyboard' | 'none',
  initial: { x: 0, y: 0 },
  claimId: null as string | null,
  initialBounds: { x: 0, y: 0, width: 0, height: 0 },
  /**
   * An offset to apply to the gesture position before doing any hit-testing or rendering --
   * Used to offset for touch events so the dragged element isn't obscured by the user's finger.
   */
  offset: { x: 0, y: 0 },
  current: { x: motionValue(0), y: motionValue(0) },
  currentRaw: { x: 0, y: 0 },
  delta: { x: motionValue(0), y: motionValue(0) },
  velocity: { x: motionValue(0), y: motionValue(0) },
  /**
   * Records the position relative to the grabbed element where the gesture began; can be
   * used to keep the grabbed element in the same position relative to the cursor
   * when dragging.
   */
  activationPosition: { x: 0, y: 0 },
  /**
   * Cumulative movement since the gesture started. For example if
   * you dragged 6px to left and 6px to right, this will be x=12,
   * but delta will be x=0.
   */
  totalMovement: { x: 0, y: 0 },
  /**
   * A filtering mechanism to avoid checking every monitored element.
   * Set by the claiming dragged item.
   */
  targetTag: TAGS.DROPPABLE,
  /** The droppable ID which used to contain the currently dragged item */
  draggedFrom: null as string | null,
};

(window as any).gesture = gesture; // for debugging

export function resetGesture() {
  gesture.active = false;
  gesture.type = 'none';
  gesture.claimId = null;
  gesture.draggedFrom = null;
  setVector(gesture.current, 0, 0);
  setVector(gesture.currentRaw, 0, 0);
  setVector(gesture.delta, 0, 0);
  setVector(gesture.velocity, 0, 0);
  setVector(gesture.offset, 0, 0);
  setVector(gesture.activationPosition, 0, 0);
  setVector(gesture.totalMovement, 0, 0);
  gesture.initialBounds.x = 0;
  gesture.initialBounds.y = 0;
  gesture.initialBounds.width = 0;
  gesture.initialBounds.height = 0;
  gesture.targetTag = TAGS.DROPPABLE;
}

export type DragGestureContext = typeof gesture;

type GestureEvent = PointerEvent | MouseEvent | TouchEvent;

export function useMonitorGlobalGesture() {
  function startGesture(event: GestureEvent) {
    gesture.active = true;
    const coordinate = getEventCoordinates(event);
    gesture.type = isTouchEvent(event) ? 'touch' : 'mouse';
    setVector(gesture.offset, 0, gesture.type === 'touch' ? -40 : 0);
    coordinate.x += gesture.offset.x;
    coordinate.y += gesture.offset.y;
    setVector(gesture.initial, coordinate.x, coordinate.y);
    setVector(gesture.current, coordinate.x, coordinate.y);
    setVector(gesture.currentRaw, coordinate.x, coordinate.y);
    setVector(gesture.delta, 0, 0);
    setVector(gesture.velocity, 0, 0);
    setVector(gesture.activationPosition, 0, 0);
    setVector(gesture.totalMovement, 0, 0);
    gesture.initialBounds.x = 0;
    gesture.initialBounds.y = 0;
    gesture.initialBounds.width = 0;
    gesture.initialBounds.height = 0;

    gestureEvents.emit('start', gesture);
    dndLogger.debug(
      `Gesture started, type: ${event.type} ${gesture.type} at (${coordinate.x}, ${coordinate.y})`,
    );
  }

  const updateOver = () => {
    const overlapped = boundsRegistry.getContainingRegions(gesture.currentRaw, {
      tag: gesture.targetTag,
    });
    if (overlapped.length > 0) {
      if (overlapped.length > 1) {
        dndLogger.debug(
          `Multiple overlapping regions found, sorting by priority: ${overlapped.map((o) => `${o.id}: ${o.priority}`).join(', ')}`,
        );
        overlapped.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        dndLogger.debug(`Selected region: ${overlapped[0].id}`);
      }
      // find highest priority
      // set the first one as the over region
      useDndStore.getState().setOverRegion(overlapped[0].id);
    } else {
      useDndStore.getState().setOverRegion(null);
    }
  };

  let tmpVector = { x: 0, y: 0 };
  function moveGesture(event: GestureEvent) {
    const coords = getEventCoordinates(event);
    coords.x += gesture.offset.x;
    coords.y += gesture.offset.y;
    applySubtraction(gesture.initial, coords, gesture.delta);
    applySubtraction(gesture.current, coords, gesture.velocity);
    setVector(gesture.current, coords.x, coords.y);
    setVector(gesture.currentRaw, coords.x, coords.y);
    tmpVector.x = Math.abs(gesture.velocity.x.get());
    tmpVector.y = Math.abs(gesture.velocity.y.get());
    applyAddition(gesture.totalMovement, tmpVector, gesture.totalMovement);

    updateOver();

    gestureEvents.emit('move', gesture);
  }

  function endGesture() {
    gesture.active = false;
    useDndStore.getState().endDrag(gesture);
    document.body.style.userSelect = '';

    gestureEvents.emit('end', gesture);
    resetGesture();
  }

  function cancelGesture() {
    gesture.active = false;
    useDndStore.getState().cancelDrag();
    document.body.style.userSelect = '';

    gestureEvents.emit('cancel', gesture);
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
    (ev) => {
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
          applySubtraction(gesture.initial, coord, gesture.delta);
          coord.x += gesture.offset.x;
          coord.y += gesture.offset.y;
          setVector(gesture.velocity, velocity.x, velocity.y);
          setVector(gesture.current, coord.x, coord.y);
          setVector(gesture.currentRaw, coord.x, coord.y);

          // track overlapping regions
          const overlapped = boundsRegistry.getContainingRegions(coord, {
            tag: gesture.targetTag,
          });
          if (overlapped.length > 0) {
            useDndStore.getState().setOverRegion(overlapped[0].id);
          } else {
            useDndStore.getState().setOverRegion(null);
          }

          gestureEvents.emit('move', gesture);
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
    onClaim?: (id: string, gesture: DragGestureContext) => void;
  },
  options: {
    disabled?: boolean;
  } = { disabled: false },
) {
  const onStart = useStableCallback(() => callbacks.onStart?.(gesture));
  const onMove = useStableCallback(() => callbacks.onMove?.(gesture));
  const onEnd = useStableCallback(() => callbacks.onEnd?.(gesture));
  const onCancel = useStableCallback(() => callbacks.onCancel?.(gesture));
  const onClaim = useStableCallback((id: string) =>
    callbacks.onClaim?.(id, gesture),
  );
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
  useEffect(() => {
    if (options.disabled) return;
    return gestureEvents.subscribe('claim', onClaim);
  }, [onClaim, options.disabled]);

  const claim = useCallback(
    (
      id: string,
      element: HTMLElement,
      {
        targetTag = TAGS.DROPPABLE,
        droppableParentId = null,
      }: {
        targetTag?: string;
        droppableParentId?: string | null;
      } = {},
    ) => {
      // cancel any existing text selection and prevent text selection globally
      document.body.style.userSelect = 'none';

      gesture.claimId = id;
      gesture.targetTag = targetTag;
      gesture.draggedFrom = droppableParentId;
      const elPosition = element?.getBoundingClientRect();
      const { x, y } = getCurrentVector(gesture.current);
      const xOffset = elPosition ? x - elPosition.left : 0;
      const yOffset = elPosition ? y - elPosition.top : 0;
      setVector(gesture.activationPosition, xOffset, yOffset);
      if (elPosition) {
        gesture.initialBounds.x = elPosition.left;
        gesture.initialBounds.y = elPosition.top;
        gesture.initialBounds.width = elPosition.width;
        gesture.initialBounds.height = elPosition.height;
      }
      gestureEvents.emit('claim', id, gesture);
    },
    [],
  );

  const startKeyboardDrag = useCallback(
    (
      id: string,
      element: HTMLElement,
      {
        targetTag = TAGS.DROPPABLE,
        droppableParentId = null,
      }: { targetTag?: string; droppableParentId?: string | null } = {},
    ) => {
      claim(id, element, { targetTag, droppableParentId });
      setVector(gesture.offset, 0, 0);
      const currentX =
        gesture.initialBounds.x + gesture.initialBounds.width / 2;
      const currentY =
        gesture.initialBounds.y + gesture.initialBounds.height / 2;
      setVector(gesture.current, currentX, currentY);
      setVector(gesture.currentRaw, currentX, currentY);
      setVector(gesture.delta, 0, 0);
      setVector(gesture.velocity, 0, 0);
      setVector(
        gesture.initial,
        gesture.initialBounds.x,
        gesture.initialBounds.y,
      );
      gesture.active = true;
      gesture.type = 'keyboard';
      gestureEvents.emit('start', gesture);
    },
    [claim],
  );

  const cancelKeyboardDrag = useCallback(() => {
    document.body.style.userSelect = '';
    gestureEvents.emit('cancel', gesture);
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

export type VectorLike =
  | { x: number; y: number }
  | { x: MotionValue<number>; y: MotionValue<number> };

export function getCurrentVector(v: VectorLike): { x: number; y: number } {
  if (v.x instanceof MotionValue && v.y instanceof MotionValue) {
    return { x: v.x.get(), y: v.y.get() };
  } else {
    return { x: v.x as number, y: v.y as number };
  }
}

export function setVector(v: VectorLike, x: number, y: number) {
  if (v.x instanceof MotionValue && v.y instanceof MotionValue) {
    v.x.set(x);
    v.y.set(y);
  } else {
    v.x = x;
    v.y = y;
  }
}

function getNumberOrMotionValue(v: number | MotionValue<number>): number {
  return v instanceof MotionValue ? v.get() : v;
}

function applySubtraction(a: VectorLike, b: VectorLike, target: VectorLike) {
  const dx = getNumberOrMotionValue(a.x) - getNumberOrMotionValue(b.x);
  const dy = getNumberOrMotionValue(a.y) - getNumberOrMotionValue(b.y);
  if (target.x instanceof MotionValue) {
    (target.x as MotionValue).set(dx);
  } else {
    target.x = dx;
  }
  if (target.y instanceof MotionValue) {
    (target.y as MotionValue).set(dy);
  } else {
    target.y = dy;
  }
}
const invertTmpVector = { x: 0, y: 0 };
function applyAddition(a: VectorLike, b: VectorLike, target: VectorLike) {
  invertTmpVector.x = getNumberOrMotionValue(b.x);
  invertTmpVector.y = getNumberOrMotionValue(b.y);
  invertTmpVector.x = -invertTmpVector.x;
  invertTmpVector.y = -invertTmpVector.y;
  applySubtraction(a, invertTmpVector, target);
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
