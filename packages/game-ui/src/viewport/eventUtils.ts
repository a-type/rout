export function isTouchEvent(event: Event) {
  if (event.type.startsWith('touch')) return true;
  if (event.type.startsWith('pointer'))
    return (event as PointerEvent).pointerType === 'touch';
  return false;
}

export function isMouseEvent(event: Event) {
  if (event.type.startsWith('mouse')) return true;
  if (event.type.startsWith('pointer'))
    return (event as PointerEvent).pointerType === 'mouse';
  return false;
}

export function isLeftButton(buttons: number) {
  return !!(buttons & 1);
}

export function isMiddleButton(buttons: number) {
  return !!(buttons & 4);
}

export function isRightButton(buttons: number) {
  return !!(buttons & 2);
}
