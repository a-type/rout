import { EventSubscriber } from '@a-type/utils';

export const dndEvents = new EventSubscriber<{
  candidate: (id: string) => void;
  start: (id: string) => void;
  drop: (id: string, targetId: string) => void;
  cancel: (id: string) => void;
}>();
