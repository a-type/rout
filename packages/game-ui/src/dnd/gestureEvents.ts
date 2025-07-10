import { EventSubscriber } from '@a-type/utils';
import { DragGestureContext } from './gestureStore';

export const gestureEvents = new EventSubscriber<{
  start: (gesture: DragGestureContext) => void;
  move: (gesture: DragGestureContext) => void;
  end: (gesture: DragGestureContext) => void;
  cancel: (gesture: DragGestureContext) => void;
  claim: (id: string, gesture: DragGestureContext) => void;
}>();
