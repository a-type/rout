import { memo, useEffect, useState } from 'react';
import { dndEvents } from './dndEvents.js';
import { useDndStore } from './dndStore.js';

export interface DndAllyProps {}

export const DndAlly = memo(function DndAlly({}: DndAllyProps) {
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
      dndEvents.subscribe('over', (overRegion) => {
        const dragged =
          useDndStore.getState().dragging || useDndStore.getState().candidate;
        setAnnouncement(
          `Draggable item ${dragged} dragged over droppable region ${overRegion}`,
        );
      }),
      dndEvents.subscribe('out', () => {
        const dragged =
          useDndStore.getState().dragging || useDndStore.getState().candidate;
        if (!dragged) return;
        setAnnouncement(
          `Draggable item ${dragged} is no longer over a droppable region`,
        );
      }),
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
});
