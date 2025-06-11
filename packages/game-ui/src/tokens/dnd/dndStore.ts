import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { dndEvents } from './dndEvents';

export type DraggableData<T = any> = {
  id: string;
  data: T;
};

export type DndStoreValue = {
  overlayElement: HTMLElement | null;
  overlayRef: (element: HTMLElement | null) => void;
  candidate: string | null;
  dragging: string | null;
  setCandidate: (id: string) => void;
  startDrag: (id: string | null) => void;
  endDrag: () => void;

  data: Record<string, any>;
  bindData: (id: string, data: any) => () => void;

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
      data: {},

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
      endDrag: () => {
        const { dragging, overRegion } = get();
        if (dragging) {
          if (overRegion) {
            dndEvents.emit('drop', dragging, overRegion);
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
      setOverRegion: (regionId: string | null) => {
        set((state) => {
          state.overRegion = regionId;
        });
      },

      bindData: (id: string, data: any) => {
        console.debug('bindData', id, data);
        set((state) => {
          state.data[id] = data;
        });
        return () => {
          console.debug('unbindData', id);
          set((state) => {
            delete state.data[id];
          });
        };
      },
    })),
  ),
);

(window as any).dndStore = useDndStore; // For debugging in browser console
