import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useElementEvent, useWindowEvent } from '../../hooks/useWindowEvent';
import { DraggableData, useDndStore } from './dndStore';
import { DraggedBox } from './draggedBox';

export interface DragGestureContext {
  initial: { x: number; y: number };
  current: { x: number; y: number };
  delta: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface DragGestureOptions {
  allowStartFromDragIn?: boolean;
  activationConstraint?: (ctx: DragGestureContext) => boolean;
}

export type DragGestureActivationConstraint =
  DragGestureOptions['activationConstraint'];

export function useDragGesture(
  draggable: DraggableData,
  options?: DragGestureOptions,
) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef<DragGestureContext>({
    initial: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
  });

  const hasDragging = useDndStore((state) => !!state.dragging);
  const [isCandidate, setCandidate] = useDndStore(
    useShallow((state) => [
      state.candidate?.id === draggable.id,
      state.setCandidate,
    ]),
  );
  const [isDragging, startDrag, setDragPosition] = useDndStore(
    useShallow((state) => [
      state.dragging?.id === draggable.id,
      state.startDrag,
      state.setDragPosition,
    ]),
  );

  const monitorGlobalEvents = isCandidate || isDragging;

  function beginDrag(ev: InputEvent) {
    console.debug('beginDrag', draggable.id);
    stateRef.current.initial = getEventCoordinates(ev);
    stateRef.current.current = { ...stateRef.current.initial };
    stateRef.current.delta = { x: 0, y: 0 };

    if (!options?.activationConstraint) {
      return activateDrag(ev);
    } else {
      setCandidate(draggable);
    }
  }

  function activateDrag(ev: InputEvent) {
    console.debug('activateDrag', draggable.id);
    startDrag(draggable, getEventCoordinates(ev));
  }

  function moveDrag(ev: InputEvent) {
    // update gesture state
    if (isCandidate || isDragging) {
      console.debug('moveDrag', draggable.id);
      const coords = getEventCoordinates(ev);
      applySubtraction(
        stateRef.current.initial,
        coords,
        stateRef.current.delta,
      );
      applySubtraction(
        stateRef.current.current,
        coords,
        stateRef.current.velocity,
      );
      stateRef.current.current = coords;
    }

    // apply changes

    // check for activation constraint
    if (
      isCandidate &&
      !isDragging &&
      options?.activationConstraint?.(stateRef.current)
    ) {
      activateDrag(ev);
    } else if (isDragging) {
      // we are dragging this item
      setDragPosition(stateRef.current.current.x, stateRef.current.current.y);
    }
  }

  function endDrag(ev: InputEvent) {
    console.debug('endDrag', draggable.id);
    if (isDragging) {
      // end the drag
      useDndStore.getState().endDrag();
    } else if (isCandidate) {
      // cancel the candidate
      useDndStore.getState().setCandidate(null);
    }
  }

  // we attach these to window so we don't lose them
  useWindowEvent('pointermove', moveDrag, { disabled: !monitorGlobalEvents });
  useWindowEvent('pointerup', endDrag, { disabled: !monitorGlobalEvents });
  useWindowEvent('pointercancel', endDrag, { disabled: !monitorGlobalEvents });

  // when pointer down starts on our element, that marks it as the active
  // drag candidate
  useElementEvent(ref, 'pointerdown', beginDrag);

  // when the pointer enters our element, if a touch our mouse is down,
  // and no other element is dragging, that counts as beginning candidacy
  const startFromDragIn = !!options?.allowStartFromDragIn;
  useElementEvent(
    ref,
    'pointerover',
    (ev) => {
      if (ev.buttons > 0 && !hasDragging) {
        beginDrag(ev);
      }
    },
    { disabled: !startFromDragIn },
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
        beginDrag(ev);
      }
    },
    {
      disabled: !startFromDragIn,
    },
  );

  return {
    ref,
    isCandidate,
    isDragging,
    stateRef,
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

function applySubtraction(
  a: { x: number; y: number },
  b: { x: number; y: number },
  target: { x: number; y: number } = { x: 0, y: 0 },
) {
  target.x = a.x - b.x;
  target.y = a.y - b.y;
  return target;
}
