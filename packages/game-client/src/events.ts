import { RawChatMessage } from './types.js';

type ServerEventMap = {
  'game-state-update': {
    // clients should refetch from API here.
    // TODO: include data in event?
  };
  'chat-message': RawChatMessage;
};

export class EventSubscriber<Events extends Record<string, any>> {
  constructor(private source: EventSource) {}

  subscribe<K extends keyof Events>(
    event: K,
    callback: (data: Events[K]) => void,
  ): () => void {
    const listener = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.debug('Event', event.type, data);
      callback(data);
    };
    this.source.addEventListener(event as string, listener);

    return () => {
      this.source.removeEventListener(event as string, listener);
    };
  }
}

export type ServerEvents = EventSubscriber<ServerEventMap>;

export function createEvents(
  host: string,
  gameSessionId: string,
): ServerEvents {
  const source = new EventSource(`${host}/events/${gameSessionId}`, {
    withCredentials: true,
  });

  // provides typing for events and subscribe/unsubscribe semantics
  return new EventSubscriber<ServerEventMap>(source);
}
