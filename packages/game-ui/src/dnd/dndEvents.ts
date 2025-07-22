import { EventSubscriber } from '@a-type/utils';
import { DragGestureContext } from './gestureStore.js';

export const dndEvents = new EventSubscriber<{
  candidate: (id: string) => void;
  start: (id: string) => void;
  drop: (id: string, targetId: string, gesture: DragGestureContext) => void;
  cancel: (id: string) => void;
  over: (droppableId: string) => void;
  out: () => void;
}>();
