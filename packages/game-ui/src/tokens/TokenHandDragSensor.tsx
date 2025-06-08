import { Sensor, UniqueIdentifier } from '@dnd-kit/abstract';
import { Draggable } from '@dnd-kit/dom';

/**
 * A modified pointer sensor for dragging tokens from a hand. It activates
 * on pointerover (not pointerdown) to allow the user to move their finger
 * along the hand and begin a drag from any particular token they are over.
 *
 * It starts the drag only when the user moves their pointer upward
 * past a certain threshold (80px).
 */
export class TokenHandDragSensor extends Sensor {
  static globalState = {
    activeCandidateId: null as UniqueIdentifier | null,
  };
  private initialCoordinates: { x: number; y: number } | null = null;
  bind = (source: Draggable, options?: unknown) => {
    const unbind = this.registerEffect(() => {
      const target = source.handle ?? source.element;
      if (!target || !(target instanceof HTMLElement)) {
        return;
      }
      const document = target.ownerDocument;

      const handleEnter = (event: PointerEvent) => {
        if (this.disabled) return;

        // enter-based drag initiation is disabled when a drag is already in progress
        if (this.manager.dragOperation.status.dragging) {
          console.log('dragging already in progress', source.id);
          return;
        }

        console.log('enter', source.id);

        // if button is already down when pointer enters,
        // we defer to handledown
        if (event.buttons > 0) {
          handleDown(event);
          return;
        }
      };

      const handleDown = (event: PointerEvent) => {
        if (this.disabled) return;
        console.log('down', source.id);

        this.initialCoordinates = getCoordinates(event);
        document.addEventListener('pointermove', handleMove);
        // We set the active candidate ID to the source ID
        TokenHandDragSensor.globalState.activeCandidateId = source.id;
      };

      const handleMove = (event: PointerEvent) => {
        if (this.disabled) return;
        if (!this.initialCoordinates) {
          console.log('no initial coordinates', source.id);
          return;
        }
        if (
          TokenHandDragSensor.globalState.activeCandidateId &&
          TokenHandDragSensor.globalState.activeCandidateId !== source.id
        ) {
          // If the active candidate ID is set and does not match the source ID,
          // we ignore the move event. Another token is already being dragged or
          // is being evaluated for dragging.
          console.log(
            'not our move',
            source.id,
            TokenHandDragSensor.globalState.activeCandidateId,
          );
          return;
        }

        if (
          this.manager.dragOperation.status.dragging &&
          this.manager.dragOperation.source?.id === source.id
        ) {
          console.log('move', source.id);
          this.manager.actions.move({
            event,
            to: getCoordinates(event),
          });
        } else {
          // activation logic
          const delta = getDelta(
            this.initialCoordinates,
            getCoordinates(event),
          );

          if (Math.abs(delta.y) > 80) {
            console.log('start drag', source.id);
            this.manager.actions.setDragSource(source.id);
            this.manager.actions.start({
              event,
              coordinates: getCoordinates(event),
            });
          } else {
            // If the delta is not enough to start a drag, we ignore the move
            // event and do not set the active candidate ID.
            console.log('not enough delta', source.id, delta);
            return;
          }
        }
      };

      const handleEnd = (event: PointerEvent) => {
        document.removeEventListener('pointermove', handleMove);
        if (this.disabled) return;
        console.log('end', source.id);

        this.manager.actions.stop({
          event,
          canceled: event.type === 'pointercancel',
        });
        this.initialCoordinates = null;
        TokenHandDragSensor.globalState.activeCandidateId = null;
      };

      target.addEventListener('pointerenter', handleEnter);
      target.addEventListener('pointerdown', handleDown);
      document.addEventListener('pointerup', handleEnd);
      document.addEventListener('pointercancel', handleEnd);

      return () => {
        target.removeEventListener('pointerenter', handleEnter);
        target.removeEventListener('pointerdown', handleDown);
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleEnd);
        document.removeEventListener('pointercancel', handleEnd);
      };
    });
    return unbind;
  };
}

function getCoordinates(event: PointerEvent) {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function getDelta(
  initial: { x: number; y: number } | null,
  current: { x: number; y: number },
) {
  if (!initial) return { x: 0, y: 0 };
  return {
    x: current.x - initial.x,
    y: current.y - initial.y,
  };
}
