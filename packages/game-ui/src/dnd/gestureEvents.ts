import { EventSubscriber } from '@a-type/utils';

export const gestureEvents = new EventSubscriber<{
  start: () => void;
  move: () => void;
  end: () => void;
  cancel: () => void;
  claim: (id: string) => void;
}>();
