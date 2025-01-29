import {
  ClientMessageWithoutId,
  LongGameError,
  PrefixedId,
  ServerMessage,
  ServerMessageByType,
  ServerMessageType,
} from '@long-game/common';
import { apiRpc } from './api';

export type GameSocket = Awaited<ReturnType<typeof connectToSocket>>;

export async function connectToSocket(gameSessionId: PrefixedId<'gs'>) {
  const socketOrigin = import.meta.env.VITE_PUBLIC_API_ORIGIN.replace(
    /^http/,
    'ws',
  );
  const websocket = new ReconnectingWebsocket(
    `${socketOrigin}/socket`,
    gameSessionId,
  );
  const unsubRootMessages = websocket.onMessage((message) => {
    console.debug('Received message', message);
  });
  const unsubErrors = websocket.onError(console.error);

  function send<T extends ClientMessageWithoutId>(message: T) {
    (message as any).messageId = Math.random().toString().slice(2);
    websocket.send(JSON.stringify(message));
  }

  const unsubs: (() => void)[] = [];

  function request<
    T extends ClientMessageWithoutId,
    Response extends ServerMessage = ServerMessage,
  >(message: T): Promise<Response> {
    const messageId = Math.random().toString().slice(2);
    (message as any).messageId = messageId;
    const response = new Promise<ServerMessage>((resolve, reject) => {
      const unsub = websocket.onMessage(function handler(message) {
        if (message.responseTo === messageId) {
          unsub();
          resolve(message);
        }
      });
      unsubs.push(unsub);
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 5000);
    });
    websocket.send(JSON.stringify(message));
    return response as Promise<Response>;
  }

  function subscribe<T extends ServerMessageType>(
    type: T,
    handler: (message: ServerMessageByType<T>) => void,
  ) {
    const unsub = websocket.onMessage((message) => {
      if (message.type === type) {
        handler(message as ServerMessageByType<T>);
      }
    });
    unsubs.push(unsub);
    return unsub;
  }

  function unsubscribeAll() {
    unsubs.forEach((unsub) => unsub());
    unsubErrors();
    unsubRootMessages();
  }

  setInterval(() => {
    send({ type: 'ping' });
  }, 10000);
  send({ type: 'ping' });

  return {
    send,
    request,
    subscribe,
    unsubscribeAll,
  };
}

async function getSocketToken(gameSessionId: string) {
  const res = await apiRpc.gameSessions[':id'].socketToken.$get({
    param: { id: gameSessionId },
  });
  if (!res.ok) {
    throw new LongGameError(
      LongGameError.Code.Unknown,
      'Failed to get socket token',
    );
  }
  const body = await res.json();
  return body.token;
}

class ReconnectingWebsocket {
  private websocket: WebSocket | null = null;
  private messageEvents = new EventTarget();
  private errorEvents = new EventTarget();
  private backlog: string[] = [];

  constructor(private url: string, private gameSessionId: string) {
    this.reconnect();
  }

  send(message: string) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
    } else {
      this.backlog.push(message);
    }
  }

  onMessage(handler: (event: ServerMessage) => void) {
    function wrappedHandler(event: Event) {
      if (event instanceof MessageEvent) {
        const msg = JSON.parse(event.data) as ServerMessage;
        handler(msg);
      }
    }
    this.messageEvents.addEventListener('message', wrappedHandler);
    return () => {
      this.messageEvents.removeEventListener('message', wrappedHandler);
    };
  }

  onError(handler: (event: Event) => void) {
    this.errorEvents.addEventListener('error', handler);
    return () => {
      this.errorEvents.removeEventListener('error', handler);
    };
  }

  close() {
    this.websocket?.close();
  }

  async reconnect() {
    const token = await getSocketToken(this.gameSessionId);
    const url = new URL(this.url);
    url.searchParams.set('token', token);
    const websocket = (this.websocket = new WebSocket(url));
    websocket.addEventListener('open', () => {
      console.log('Socket connected');
      if (this.backlog.length) {
        this.backlog.forEach((msg) => websocket.send(msg));
        this.backlog = [];
      }
    });
    websocket.addEventListener('close', (ev) => {
      if (ev.code === 1000) {
        return;
      }

      setTimeout(() => {
        this.reconnect();
      }, 3000);
    });
    websocket.addEventListener('message', (event) => {
      this.messageEvents.dispatchEvent(
        new MessageEvent('message', {
          data: event.data,
        }),
      );
    });
    websocket.addEventListener('error', (event) => {
      const err =
        event instanceof ErrorEvent ? event.error : new Error('Unknown error');
      this.errorEvents.dispatchEvent(
        new ErrorEvent('error', {
          error: err,
        }),
      );
    });
  }
}
