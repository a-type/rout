import { Connection } from '@a-type/dialogue';
import {
  clientMessageShape,
  ClientMessageWithoutId,
  clientPingMessageShape,
  LongGameError,
  PrefixedId,
  ServerMessage,
  serverMessageShape,
} from '@long-game/common';
import { API_ORIGIN } from '../config.js';
import { apiRpc } from './api.js';

export type GameSocket = Awaited<ReturnType<typeof connectToSocket>>;

const ping = clientPingMessageShape.parse({
  type: 'ping',
});

export function connectToSocket(gameSessionId: PrefixedId<'gs'>) {
  const socketOrigin = API_ORIGIN.replace(/^http/, 'ws');
  const connection = new Connection({
    websocket: {
      getUrl: async () => {
        const token = await getSocketToken(gameSessionId);
        const url = new URL(`${socketOrigin}/socket`);
        url.searchParams.set('token', token);
        return url.toString();
      },
    },
    heartbeat: {
      getPing: () => JSON.stringify(ping),
      interval: 20_000,
      pongTimeout: 2_000,
    },
    messageTypeKey: 'type',
    parseClientMessage: clientMessageShape.parse,
    parseServerMessage: serverMessageShape.parse,
    preprocessClientMessage: (message: ClientMessageWithoutId) => {
      return {
        ...message,
        messageId: Math.random().toString().slice(2),
      };
    },
  });

  connection.websocket.onConnect(() => {
    connection.send({ type: 'greeting' });
  });

  async function request<
    T extends ClientMessageWithoutId,
    Response extends ServerMessage = ServerMessage,
  >(message: T): Promise<Response> {
    const response = await connection.request(message);
    if (response.type === 'error') {
      throw new LongGameError(
        response.code ?? LongGameError.Code.Unknown,
        response.message,
      );
    }
    return response as Response;
  }

  return {
    id: connection.websocket.id,
    send: connection.send,
    request,
    subscribe: connection.on,
    disconnect: () => {
      connection.send({ type: 'disconnecting' });
      connection.close();
    },
    reconnect: () => {
      connection.open();
      return () => {
        connection.close();
      };
    },
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
