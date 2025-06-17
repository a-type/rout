import { useEffect, useState } from 'react';
import { dndEvents } from './dndEvents';
import { useDndStore } from './dndStore';

export interface DndAllyProps {}

export function DndAlly({}: DndAllyProps) {
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const unsubs = [
      dndEvents.subscribe('start', (id) => {
        setAnnouncement(`Picked up draggable item ${id}`);
      }),
      dndEvents.subscribe('drop', (id, regionId) => {
        setAnnouncement(`Draggable item ${id} dropped on region ${regionId}`);
      }),
      dndEvents.subscribe('cancel', (id) => {
        setAnnouncement(`Cancelled dragging ${id}`);
      }),
      useDndStore.subscribe(
        (state) => state.overRegion,
        (overRegion) => {
          if (overRegion) {
            setAnnouncement(
              `Draggable item ${useDndStore.getState().dragging} dragged over   droppable region ${overRegion}`,
            );
          } else {
            setAnnouncement(
              `Draggable item ${useDndStore.getState().dragging} is no longer over a droppable region`,
            );
          }
        },
      ),
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <>
      <div id="dnd-instructions" className="sr-only">
        To pick up a draggable item, press the spacebar or enter key. While
        dragging, move the item with the arrow keys. To drop the item, press the
        spacebar or enter key again. Use escape to cancel a drag.
      </div>
      <div id="dnd-announcer" className="sr-only" aria-live="polite">
        {/* TODO: customizable */}
        {announcement}
      </div>
    </>
  );
}
