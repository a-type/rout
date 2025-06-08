import { DragOperation, Modifier } from '@dnd-kit/abstract';

export class CenterOnCursorModifier extends Modifier {
  apply = (operation: DragOperation): { x: number; y: number } => {
    if (this.disabled || !operation.activatorEvent) return operation.transform;

    const activatorCoordinates = getEventCoordinates(operation.activatorEvent);
    const rect = operation.shape?.initial.boundingRectangle;
    if (!activatorCoordinates || !rect) {
      return operation.transform;
    }

    return {
      x:
        operation.transform.x +
        (activatorCoordinates.x - rect.left) -
        rect.width / 2,
      y:
        operation.transform.y +
        (activatorCoordinates.y - rect.top) -
        rect.height / 2,
    };
  };
}

function getEventCoordinates(event: Event): { x: number; y: number } | null {
  if ('touches' in event || 'changedTouches' in event) {
    const { touches, changedTouches } = event as TouchEvent;
    if (touches && touches.length) {
      const { clientX: x, clientY: y } = touches[0];

      return {
        x,
        y,
      };
    } else if (changedTouches && changedTouches.length) {
      const { clientX: x, clientY: y } = changedTouches[0];

      return {
        x,
        y,
      };
    }
  }

  if ('clientX' in event && 'clientY' in event) {
    return {
      x: event.clientX as number,
      y: event.clientY as number,
    };
  }

  return null;
}
