import {
  clientMessageShape,
  ClientMessageWithoutId,
  ClientPingMessage,
  Logger,
  LongGameError,
  PrefixedId,
  ServerMessage,
  ServerMessageByType,
  serverMessageShape,
  ServerMessageType,
} from '@long-game/common';
import { API_ORIGIN } from '../config.js';
import { apiRpc } from './api.js';

export type GameSocket = Awaited<ReturnType<typeof connectToSocket>>;

const logger = new Logger('🌐', 'socket');

export function connectToSocket(gameSessionId: PrefixedId<'gs'>) {
  const socketOrigin = API_ORIGIN.replace(/^http/, 'ws');
  const websocket = new ReconnectingWebsocket(
    `${socketOrigin}/socket`,
    gameSessionId,
  );

  const unsubRootMessages = websocket.onMessage((message) => {
    // console.debug('Received message', message); // too noisy
  });
  const unsubErrors = websocket.onError(console.error);

  function send<T extends ClientMessageWithoutId>(message: T) {
    (message as any).messageId = Math.random().toString().slice(2);
    const result = clientMessageShape.safeParse(message);
    if (!result.success) {
      logger.urgent('Outgoing message validation failed', result.error);
      throw new Error('Invalid message');
    }
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
        try {
          const parsed = serverMessageShape.parse(message);
          if (parsed.responseTo === messageId) {
            unsub();
            if (parsed.type === 'error') {
              reject(
                new LongGameError(
                  parsed.code ?? LongGameError.Code.Unknown,
                  parsed.message,
                ),
              );
            } else {
              resolve(parsed);
            }
          }
        } catch (e) {
          logger.urgent('Incoming message validation failed', e);
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
      const parsed = serverMessageShape.safeParse(message);
      if (!parsed.success) {
        logger.urgent('Incoming message validation failed', parsed.error);
        return;
      }
      if (parsed.data.type === type) {
        handler(parsed.data as ServerMessageByType<T>);
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

  function disconnect() {
    send({ type: 'disconnecting' });
    websocket.close();
  }

  function reconnect() {
    websocket.reconnect();
    return () => {
      websocket.close();
    };
  }

  return {
    send,
    request,
    subscribe,
    unsubscribeAll,
    disconnect,
    reconnect,
    id: websocket.id,
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
  #id = Math.random().toString(36).slice(2);
  get id() {
    return this.#id;
  }
  #status: 'closed' | 'open' | 'reconnecting' = 'closed';
  get status() {
    return this.#status;
  }
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private abortReconnect = false;
  private heartbeat;
  private reconnectInterval = 3000;
  private reconnectAttempts = 0;

  constructor(
    private url: string,
    private gameSessionId: string,
  ) {
    this.heartbeat = new Heartbeat(this);
  }

  send = (message: string) => {
    if (this.#status === 'closed') {
      logger.warn('Socket closed, cannot send', this.#id);
      return;
    }
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
    } else {
      this.backlog.push(message);
    }
  };

  onMessage = (handler: (event: ServerMessage) => void) => {
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
  };

  onError = (handler: (event: Event) => void) => {
    this.errorEvents.addEventListener('error', handler);
    return () => {
      this.errorEvents.removeEventListener('error', handler);
    };
  };

  close = () => {
    this.heartbeat.stop();
    if (this.#status === 'reconnecting') {
      logger.debug('Socket waiting for connect before close', this.#id);
      // wait for connection before closing
      this.abortReconnect = true;
    } else {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      logger.info('Socket closing', this.#id);
      this.websocket?.close(1000, 'Closed by user');
    }
  };

  reconnect = async () => {
    if (this.abortReconnect) {
      logger.debug('Cancelling abort due to explicit reconnect', this.#id);
      this.abortReconnect = false;
    }
    if (this.reconnectAttempts >= 5) {
      logger.urgent('Max reconnect attempts reached, giving up', this.#id);
      return;
    }
    if (this.#status === 'reconnecting') {
      logger.debug('Not initiating reconnect, already reconnecting', this.#id);
      return;
    }
    this.#status = 'reconnecting';
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    try {
      const token = await getSocketToken(this.gameSessionId);
      const url = new URL(this.url);
      url.searchParams.set('token', token);
      this.websocket?.close(1000, 'Forced reconnect');
      const websocket = (this.websocket = new WebSocket(url));

      websocket.addEventListener('open', () => {
        if (this.abortReconnect) {
          logger.debug('Socket closed during [re]connect', this.#id);
          this.abortReconnect = false;
          websocket.close(1000, 'Closed during reconnect');
          return;
        }

        logger.info('Socket connected', this.#id);
        this.#status = 'open';
        this.heartbeat.start();
        this.reconnectAttempts = 0;
        this.reconnectInterval = 3000;

        if (this.backlog.length) {
          this.backlog.forEach((msg) => websocket.send(msg));
          this.backlog = [];
        }
      });
      websocket.addEventListener('close', (ev) => {
        this.#status = 'closed';
        this.heartbeat.stop();
        if (ev.code === 1000) {
          logger.debug('Socket closed normally', this.#id, ev.code, ev.reason);
          return;
        }

        logger.warn('Socket closed', this.#id, 'code', ev.code, ev.reason);
        this.#queueReconnect();
      });
      websocket.addEventListener('message', (event) => {
        this.messageEvents.dispatchEvent(
          new MessageEvent('message', {
            data: event.data,
          }),
        );
      });
      websocket.addEventListener('error', (event) => {
        logger.urgent('Socket error', this.#id, event);
        const err =
          event instanceof ErrorEvent
            ? event.error
            : new Error('Unknown error');
        this.errorEvents.dispatchEvent(
          new ErrorEvent('error', {
            error: err,
          }),
        );
      });
    } catch (e) {
      logger.urgent('Failed to reconnect socket', this.#id, e);
      this.#status = 'closed';
      this.#queueReconnect();
    }
  };

  #queueReconnect = () => {
    if (this.reconnectTimeout) {
      return;
    }
    logger.debug(
      'Queueing socket reconnect',
      this.#id,
      'in',
      this.reconnectInterval,
      'ms',
      'attempt',
      this.reconnectAttempts + 1,
    );
    this.reconnectTimeout = setTimeout(this.reconnect, this.reconnectInterval);
    this.reconnectAttempts++;
    // Exponential backoff with a max of 30s
    this.reconnectInterval = Math.min(
      30000,
      this.reconnectInterval * 2 ** this.reconnectAttempts,
    );
  };
}

class Heartbeat {
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastPong = Date.now();

  constructor(private socket: ReconnectingWebsocket) {
    socket.onMessage((message) => {
      if (message.type === 'pong') {
        this.lastPong = Date.now();
      }
    });
  }

  start() {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(() => {
      this.#sendPing();
    }, 5000);
  }

  #sendPing = () => {
    this.socket.send(
      JSON.stringify({ type: 'ping' } satisfies ClientPingMessage),
    );
    setTimeout(() => {
      if (Date.now() - this.lastPong > 15000) {
        logger.warn('No pong received, reconnecting socket');
        this.socket.reconnect();
      }
    }, 5000);
  };

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
