import { zValidator } from '@hono/zod-validator';
import {
  ClientMessage,
  ClientRequestChatMessage,
  ClientResetGameMessage,
  ClientSendChatMessage,
  ClientSubmitTurnMessage,
  ClientToggleChatReactionMessage,
  LongGameError,
  PrefixedId,
  ServerChatMessage,
  ServerMessage,
  assertPrefixedId,
  clientMessageShape,
  id,
} from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { verifySocketToken } from '../../auth/socketTokens';
import { GameSession } from './GameSession';

export interface SocketSessionInfo {
  gameSessionId: string;
  userId: PrefixedId<'u'>;
  socketId: string;
  status: 'pending' | 'ready' | 'closed';
}

export class GameSessionSocketHandler {
  #hono;
  #socketInfo = new Map<WebSocket, SocketSessionInfo>();
  #messageBacklogs = new Map<string, ServerMessage[]>();

  constructor(
    private gameSession: GameSession,
    private ctx: DurableObjectState,
    private env: ApiBindings,
  ) {
    this.#hono = this.#createHono();

    // if we've come back from hibernation, we have to repopulate our socket map
    ctx.getWebSockets().forEach((ws) => {
      const data = ws.deserializeAttachment();
      if (data) {
        this.#socketInfo.set(ws, data);
      }
    });
  }

  #createHono = () => {
    return new Hono().all(
      '/socket',
      zValidator(
        'query',
        z.object({
          token: z.string(),
        }),
      ),
      async (ctx) => {
        // expect to receive a Websocket Upgrade request
        const upgradeHeader = ctx.req.header('Upgrade');
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            'Expected a WebSocket upgrade request',
          );
        }

        // validate token and read game session id and user to connect to
        const token = ctx.req.valid('query').token;
        const { aud: gameSessionId, sub: userId } = await verifySocketToken(
          token,
          this.env.SOCKET_TOKEN_SECRET,
        );

        assertPrefixedId(userId, 'u');

        const attachedSessionId = await this.gameSession.getId();
        if (gameSessionId !== attachedSessionId) {
          console.warn(
            `Socket token for wrong DO: given ${gameSessionId}, this session ID is ${this.ctx.id.name}`,
          );
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            "Please don't try to hack us :(",
          );
        }

        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        this.ctx.acceptWebSocket(server);

        // map the socket to the token info for later reference.
        this.#updateSocketInfo(server, {
          gameSessionId,
          userId,
          status: 'pending',
          socketId: crypto.randomUUID(),
        });

        (async () => {
          // send connection notice to other players
          this.send({
            type: 'playerStatusChange',
            playerId: userId,
            playerStatus: {
              online: true,
            },
          });
          // send start of chat backlog to the new player (this will enqueue for delivery later)
          const { messages, nextToken } =
            await this.gameSession.getChatForPlayer(userId, {
              limit: 100,
            });
          if (messages.length) {
            this.send({
              type: 'chat',
              messages: messages,
              nextToken,
            });
          }
        })();

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      },
    );
  };

  #updateSocketInfo = (ws: WebSocket, info: SocketSessionInfo) => {
    this.#socketInfo.set(ws, info);
    ws.serializeAttachment(info);
  };

  fetch = (req: Request) => {
    return this.#hono.fetch(req);
  };

  send = async (
    msg: ServerMessage,
    { to, notTo }: { to?: PrefixedId<'u'>[]; notTo?: PrefixedId<'u'>[] } = {},
  ) => {
    const sockets = Array.from(this.#socketInfo.entries());
    for (const [ws, { userId, status, socketId }] of sockets) {
      if (to && !to.includes(userId)) {
        continue;
      }
      if (notTo && notTo.includes(userId)) {
        continue;
      }
      if (status === 'pending') {
        // push to backlog
        let backlog = this.#messageBacklogs.get(socketId);
        if (!backlog) {
          backlog = [];
          this.#messageBacklogs.set(socketId, backlog);
        }
        backlog.push(msg);
      } else if (status === 'closed') {
        this.#socketInfo.delete(ws);
        console.error(
          `Cannot send message to closed socket: { userId: ${userId}, socketId: ${socketId} }`,
        );
      } else {
        ws.send(JSON.stringify(msg));
      }
    }
  };

  getIsPlayerOnline = (userId: PrefixedId<'u'>) => {
    const sockets = Array.from(this.#socketInfo.values());
    for (const { userId: id, status } of sockets) {
      if (id === userId) {
        return status === 'ready';
      }
    }
    return false;
  };

  onMessage = (ws: WebSocket, message: ArrayBuffer | string) => {
    // any message is sufficient to confirm the socket is open
    const info = this.#socketInfo.get(ws);
    if (!info) {
      console.warn(
        'Received message from untracked socket',
        ws.deserializeAttachment(),
      );
      return;
    }
    if (info.status === 'pending') {
      this.#updateSocketInfo(ws, { ...info, status: 'ready' });
      console.log(
        'Socket ready',
        info.socketId,
        info.userId,
        'sending backlog',
      );
      this.#messageBacklogs.get(info.socketId)?.forEach((msg) => {
        ws.send(JSON.stringify(msg));
      });
    }
    try {
      const asObject = JSON.parse(message.toString());
      const parsed = clientMessageShape.safeParse(asObject);
      if (!parsed.success) {
        console.error(
          'Invalid message',
          parsed.error,
          'at',
          parsed.error.errors?.[0]?.path?.join('.'),
          message.toString(),
        );
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            responseTo: null,
          }),
        );
        return;
      } else {
        this.#onClientMessage(parsed.data, ws, info);
      }
    } catch (err) {
      console.error(
        'Error parsing or handling message',
        err,
        message.toString(),
      );
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Error handling message',
          responseTo: null,
        }),
      );
    }
  };

  #onClientMessage = async (
    msg: ClientMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    try {
      switch (msg.type) {
        case 'sendChat':
          await this.#onClientSendChat(msg, ws, info);
          break;
        case 'submitTurn':
          await this.#onClientSubmitTurn(msg, ws, info);
          break;
        case 'requestChat':
          await this.#onClientRequestChat(msg, ws, info);
          break;
        case 'resetGame':
          await this.#onClientResetGame(msg, ws, info);
          break;
        case 'toggleChatReaction':
          await this.#onClientToggleChatReaction(msg, ws, info);
          break;
      }
      // ack the message for the client
      ws.send(JSON.stringify({ type: 'ack', responseTo: msg.messageId }));
    } catch (err) {
      console.error('Error handling message', err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      ws.send(
        JSON.stringify({
          type: 'error',
          message,
          responseTo: msg.messageId,
        }),
      );
    }
  };

  onClose = (
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) => {
    ws.close(code, 'Goodbye');
    this.#onWebSocketCloseOrError(ws);
  };

  async onError(ws: WebSocket, error: unknown) {
    console.error('Websocket error', error);
    this.#onWebSocketCloseOrError(ws);
  }

  #onWebSocketCloseOrError = async (ws: WebSocket) => {
    const info = this.#socketInfo.get(ws);
    if (info) {
      // inform other clients that this user has left
      this.send({
        type: 'playerStatusChange',
        playerId: info.userId,
        playerStatus: {
          online: false,
        },
      });
    }
    this.#socketInfo.delete(ws);
  };

  #onClientSendChat = async (
    msg: ClientSendChatMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    await this.gameSession.addChatMessage({
      id: id('cm'),
      createdAt: new Date().toISOString(),
      authorId: info.userId,
      content: msg.message.content,
      position: msg.message.position,
      sceneId: msg.message.sceneId,
      recipientIds: msg.message.recipientIds,
      roundIndex: msg.message.roundIndex,
      metadata: msg.message.metadata,
      reactions: {},
    });
  };

  #onClientRequestChat = async (
    msg: ClientRequestChatMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    const { messages, nextToken } = await this.gameSession.getChatForPlayer(
      info.userId,
      {
        limit: 25,
        nextToken: msg.nextToken,
      },
    );
    // only reply to this socket
    const reply: ServerChatMessage = {
      type: 'chat',
      messages: messages,
      nextToken,
      responseTo: msg.messageId,
    };
    ws.send(JSON.stringify(reply));
  };

  #onClientSubmitTurn = async (
    msg: ClientSubmitTurnMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    await this.gameSession.addTurn(info.userId, msg.turnData);
  };

  #onClientResetGame = async (
    msg: ClientResetGameMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    await this.gameSession.resetGame();
  };

  #onClientToggleChatReaction = async (
    msg: ClientToggleChatReactionMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    await this.gameSession.toggleChatReaction(
      info.userId,
      msg.chatMessageId,
      msg.reaction,
      msg.isOn,
    );
  };
}
