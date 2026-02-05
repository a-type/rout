import { zValidator } from '@hono/zod-validator';
import {
  ClientMessage,
  ClientPingMessage,
  ClientRequestChatMessage,
  ClientResetGameMessage,
  ClientSendChatMessage,
  ClientSubmitTurnMessage,
  ClientToggleChatReactionMessage,
  LongGameError,
  PrefixedId,
  ServerChatMessage,
  ServerMessage,
  ServerPongMessage,
  assertPrefixedId,
  clientMessageShape,
  id,
} from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { verifySocketToken } from '../../auth/socketTokens.js';
import { GameSession } from './GameSession.js';

export interface SocketSessionInfo {
  gameSessionId: string;
  userId: PrefixedId<'u'>;
  socketId: string;
  status: 'pending' | 'ready' | 'closed';
  connectedAt: number;
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

    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair(
        JSON.stringify({ type: 'ping' } satisfies ClientPingMessage),
        JSON.stringify({ type: 'pong' } satisfies ServerPongMessage),
      ),
    );
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
          this.gameSession.log(
            'warn',
            '[GameSessionSocketHandler]',
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
        const socketId = crypto.randomUUID();
        this.#updateSocketInfo(server, {
          gameSessionId,
          userId,
          status: 'pending',
          socketId,
          connectedAt: Date.now(),
        });

        // add presence entry
        this.gameSession.presence.onSeen(userId, socketId).finally();

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
              pagination: { limit: 100 },
            });
          if (messages.length) {
            this.send({
              type: 'chat',
              messages: messages,
              nextToken,
              sceneId: null,
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
        this.gameSession.log(
          'error',
          '[GameSessionSocketHandler]',
          `Cannot send message to closed socket: { userId: ${userId}, socketId: ${socketId} }`,
        );
      } else {
        ws.send(JSON.stringify(msg));
      }
    }
  };

  onMessage = async (ws: WebSocket, message: ArrayBuffer | string) => {
    // any message is sufficient to confirm the socket is open
    const info = this.#socketInfo.get(ws);
    if (!info) {
      this.gameSession.log(
        'warn',
        '[GameSessionSocketHandler]',
        'Received message from untracked socket',
        ws.deserializeAttachment(),
      );
      return;
    }
    // out-of-band update seen
    this.gameSession.presence.onSeen(info.userId, info.socketId).finally();

    if (info.status === 'pending') {
      this.#updateSocketInfo(ws, { ...info, status: 'ready' });
      this.gameSession.log(
        'debug',
        '[GameSessionSocketHandler]',
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
        this.gameSession.log(
          'error',
          '[GameSessionSocketHandler]',
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
      this.gameSession.log(
        'error',
        '[GameSessionSocketHandler]',
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
        case 'voteForGame':
          if (msg.remove) {
            await this.gameSession.removeVoteForGame(info.userId, msg.gameId);
          } else {
            await this.gameSession.voteForGame(info.userId, msg.gameId);
          }
          break;
        case 'readyUp':
          if (msg.unready) {
            await this.gameSession.unreadyUp(info.userId);
          } else {
            await this.gameSession.readyUp(info.userId);
          }
          break;
        case 'disconnecting':
          await this.gameSession.presence.onDisconnect(
            info.userId,
            info.socketId,
          );
          break;
      }
      // ack the message for the client
      if (msg.type !== 'ping' && msg.messageId) {
        ws.send(JSON.stringify({ type: 'ack', responseTo: msg.messageId }));
      }
    } catch (err) {
      this.gameSession.log(
        'error',
        '[GameSessionSocketHandler]',
        'Error handling message',
        err,
      );
      const message = err instanceof Error ? err.message : 'An error occurred';
      ws.send(
        JSON.stringify({
          type: 'error',
          message,
          responseTo: (msg as any).messageId,
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
    this.gameSession.log(
      'error',
      '[GameSessionSocketHandler]',
      'Websocket error',
      error,
    );
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
        pagination: {
          limit: 25,
          nextToken: msg.nextToken,
        },
        filter: {
          sceneId: msg.sceneId,
        },
      },
    );
    // only reply to this socket
    const reply: ServerChatMessage = {
      type: 'chat',
      messages: messages,
      nextToken,
      responseTo: msg.messageId,
      sceneId: msg.sceneId ?? null,
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
