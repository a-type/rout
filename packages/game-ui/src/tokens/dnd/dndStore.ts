import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { dndEvents } from './dndEvents';

export type DraggableData<T = any> = {
  id: string;
  data: T;
};

export type DragGesture = {
  x: number;
  y: number;
};

export type DndStoreValue = {
  overlayElement: HTMLElement | null;
  overlayRef: (element: HTMLElement | null) => void;
  dragging: DraggableData | null;
  setDragging: (
    data: DraggableData | null,
    initialPosition?: { x: number; y: number },
  ) => void;
  endDrag: () => void;

  // DO NOT SUBSCRIBE IN RENDER
  dragGesture: DragGesture | null;
  setDragPosition: (x: number, y: number) => void;

  overRegion: string | null;
  setOverRegion: (regionId: string | null) => void;
};

export const useDndStore = create<DndStoreValue>()(
  subscribeWithSelector(
    immer((set, get) => ({
      overlayElement: null,
      dragging: null,
      dragGesture: null,
      overRegion: null,

      overlayRef: (element: HTMLElement | null) => {
        set({ overlayElement: element });
      },
      setDragging: (data: DraggableData | null, initialPosition) => {
        set({ dragging: data });
        if (initialPosition) {
          set({ dragGesture: { x: initialPosition.x, y: initialPosition.y } });
        } else {
          set({ dragGesture: { x: 0, y: 0 } });
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
        set({ dragging: null, dragGesture: null, overRegion: null });
      },
      setOverRegion: (regionId: string | null) => {
        set((state) => {
          state.overRegion = regionId;
        });
      },
      setDragPosition: (x: number, y: number) => {
        set((state) => {
          if (!state.dragGesture) {
            state.dragGesture = { x, y };
          } else {
            state.dragGesture.x = x;
            state.dragGesture.y = y;
          }
        });
      },
    })),
  ),
);

(window as any).dndStore = useDndStore; // For debugging in browser console
