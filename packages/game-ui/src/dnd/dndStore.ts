import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/shallow';
import { dndEvents } from './dndEvents';
import { DragGestureContext } from './gestureStore';

export type DraggableData<T = any> = {
  id: string;
  data: T;
};

const draggableDataRegistry = new Map<
  string,
  { data: any; refCount: number }
>();
export function registerDraggableData(id: string, value: any) {
  const existing = draggableDataRegistry.get(id);
  if (existing) {
    existing.refCount++;
  } else {
    draggableDataRegistry.set(id, { data: value, refCount: 1 });
  }
  return () => {
    const entry = draggableDataRegistry.get(id);
    if (entry) {
      entry.refCount--;
      if (entry.refCount === 0) {
        draggableDataRegistry.delete(id);
      }
    }
  };
}
export function getDraggableData(id: string) {
  const entry = draggableDataRegistry.get(id);
  if (entry) {
    return entry.data;
  }
  return null;
}

export type DndStoreValue = {
  overlayElement: HTMLElement | null;
  overlayRef: (element: HTMLElement | null) => void;
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
  subscribeWithSelector(
    immer((set, get) => ({
      overlayElement: null,
      candidate: null,
      dragging: null,
      dragGesture: { x: 0, y: 0, xOffset: 0, yOffset: 0 },
      overRegion: null,

      overlayRef: (element: HTMLElement | null) => {
        set({ overlayElement: element });
      },
      setCandidate: (id: string | null) => {
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
        set((state) => {
          state.overRegion = regionId;
        });
      },
    })),
  ),
);

(window as any).dndStore = useDndStore; // For debugging in browser console

export function useDraggedData() {
  return useDndStore(
    useShallow((state) => {
      const dragging = state.dragging;
      if (!dragging) return null;
      return {
        id: dragging,
        data: getDraggableData(dragging),
      };
    }),
  );
}
