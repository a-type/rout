import { EventSubscriber } from '@a-type/utils';
import { DraggableData } from './dndStore';

export const dndEvents = new EventSubscriber<{
  candidate: (dragged: DraggableData) => void;
  start: (
    dragged: DraggableData,
    initialPosition?: { x: number; y: number },
  ) => void;
  drop: (dragged: DraggableData, targetId: string) => void;
  cancel: (dragged: DraggableData) => void;
}>();
