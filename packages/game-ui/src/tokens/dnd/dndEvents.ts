import { EventSubscriber } from '@a-type/utils';
import { DraggableData } from './dndStore';

export const dndEvents = new EventSubscriber<{
  drop: (dragged: DraggableData, targetId: string) => void;
  cancel: (dragged: DraggableData) => void;
}>();
