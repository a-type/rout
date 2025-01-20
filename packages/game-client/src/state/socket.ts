import {
  ClientMessageWithoutId,
  LongGameError,
  PrefixedId,
  ServerMessage,
  ServerMessageByType,
  ServerMessageType,
} from '@long-game/common';
import { gameSessionRpc } from './api';

export type GameSocket = Awaited<ReturnType<typeof connectToSocket>>;

export async function connectToSocket(gameSessionId: PrefixedId<'gs'>) {
  const socketOrigin = import.meta.env.VITE_GAME_SESSION_API_ORIGIN.replace(
    /^http/,
    'ws',
  );
  // we have to get a token first
  const token = await getSocketToken(gameSessionId);
  const websocket = new WebSocket(
    `${socketOrigin}/${gameSessionId}/socket?token=${token}`,
  );
  const backlog: string[] = [];
  function bufferedSend(msg: string) {
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(msg));
    } else {
      backlog.push(msg);
    }
  }
  function onMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    console.debug('Received message', message);
  }
  websocket.addEventListener('message', onMessage);
  function onOpen() {
    console.debug('Socket connected');
    backlog.forEach((msg) => bufferedSend(msg));
  }
  websocket.addEventListener('open', onOpen);
  function onClose() {
    console.debug('Socket closed');
  }
  websocket.addEventListener('close', onClose);
  function onError(event: Event) {
    console.error('Socket error', event);
  }
  websocket.addEventListener('error', onError);

  function send<T extends ClientMessageWithoutId>(message: T) {
    (message as any).messageId = Math.random().toString().slice(2);
    bufferedSend(JSON.stringify(message));
  }

  const unsubs: (() => void)[] = [];

  function request<
    T extends ClientMessageWithoutId,
    Response extends ServerMessage = ServerMessage,
  >(message: T): Promise<Response> {
    const messageId = Math.random().toString().slice(2);
    (message as any).messageId = messageId;
    const response = new Promise<ServerMessage>((resolve, reject) => {
      websocket.addEventListener('message', function handler(event) {
        unsubs.push(() => {
          websocket.removeEventListener('message', handler);
        });
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.responseTo === messageId) {
          websocket.removeEventListener('message', handler);
          resolve(message);
        }
      });
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 5000);
    });
    bufferedSend(JSON.stringify(message));
    return response as Promise<Response>;
  }

  function subscribe<T extends ServerMessageType>(
    type: T,
    handler: (message: ServerMessageByType<T>) => void,
  ) {
    function listener(event: MessageEvent) {
      const message = JSON.parse(event.data) as ServerMessage;
      if (message.type === type) {
        handler(message as ServerMessageByType<T>);
      }
    }
    websocket.addEventListener('message', listener);
    const unsub = () => {
      websocket.removeEventListener('message', listener);
    };
    unsubs.push(unsub);
    return unsub;
  }

  function unsubscribeAll() {
    unsubs.forEach((unsub) => unsub());
    websocket.removeEventListener('message', onMessage);
    websocket.removeEventListener('open', onOpen);
    websocket.removeEventListener('close', onClose);
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
  const res = await gameSessionRpc[':id'].socketToken.$get({
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
