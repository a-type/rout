import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import { draggableDataRegistry } from './dataRegistry.js';
import { dndEvents } from './dndEvents.js';
import { DragGestureContext } from './gestureStore.js';

export type DraggableData<T = any> = {
  id: string;
  data: T;
};

export type DndStoreValue = {
  domOverlayElement: HTMLElement | null;
  domOverlayRef: (element: HTMLElement | null) => void;
  svgOverlayElement: SVGSVGElement | null;
  svgOverlayRef: (element: SVGSVGElement | null) => void;

  candidate: string | null;
  dragging: string | null;
  setCandidate: (id: string) => void;
  startDrag: (id: string | null) => void;
  endDrag: (gesture: DragGestureContext) => void;
  cancelDrag: () => void;

  overRegion: string | null;
  setOverRegion: (regionId: string | null) => void;
};

export const useDndStore = create<DndStoreValue>()(
  subscribeWithSelector((set, get) => ({
    domOverlayElement: null,
    svgOverlayElement: null,
    candidate: null,
    dragging: null,
    dragGesture: { x: 0, y: 0, xOffset: 0, yOffset: 0 },
    overRegion: null,

    domOverlayRef: (element: HTMLElement | null) => {
      set({ domOverlayElement: element });
    },
    svgOverlayRef: (element: SVGSVGElement | null) => {
      set({ svgOverlayElement: element });
    },
    setCandidate: (id: string | null) => {
      console.debug(`Drag candidate set: ${id}`);
      const current = get().candidate;
      if (current && current !== id) {
        dndEvents.emit('cancel', current);
      }

      set({ candidate: id, overRegion: null });
      if (id) {
        dndEvents.emit('candidate', id);
      }
    },
    startDrag: (id: string | null) => {
      console.debug(`Drag locked in by ${id}`);
      const current = get().dragging;
      if (current && current !== id) {
        dndEvents.emit('cancel', current);
      }

      set({
        dragging: id,
        candidate: null,
        overRegion: null,
      });
      if (id) {
        dndEvents.emit('start', id);
      }
    },
    endDrag: (gesture: DragGestureContext) => {
      const { dragging, overRegion } = get();
      if (dragging) {
        if (overRegion) {
          dndEvents.emit('drop', dragging, overRegion, gesture);
        } else {
          dndEvents.emit('cancel', dragging);
        }
      }
      set({
        dragging: null,
        overRegion: null,
        candidate: null,
      });
    },
    cancelDrag: () => {
      const { dragging } = get();
      if (dragging) {
        dndEvents.emit('cancel', dragging);
      }
      set({
        dragging: null,
        candidate: null,
        overRegion: null,
      });
    },
    setOverRegion: (regionId: string | null) => {
      if (get().overRegion === regionId) return;
      set({ overRegion: regionId });
    },
  })),
);

(window as any).dndStore = useDndStore; // For debugging in browser console

export function useDraggedData() {
  return useDndStore(
    useShallow((state) => {
      const dragging = state.dragging;
      if (!dragging) return null;
      return {
        id: dragging,
        data: draggableDataRegistry.get(dragging),
      };
    }),
  );
}
