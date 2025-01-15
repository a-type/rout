import { zValidator } from '@hono/zod-validator';
import {
  assertPrefixedId,
  GameRound,
  GameSessionChatMessage,
  LongGameError,
  PrefixedId,
} from '@long-game/common';
import {
  GameRandom,
  GameStatus,
  getLatestVersion,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono/quick';
import { z } from 'zod';
import { api } from './api';
import { Env } from './env';
import { ServerMessage } from './socketProtocol';
import { verifySocketToken } from './socketTokens';

/**
 * The basic initial data required to set up a game.
 */
export type GameSessionBaseData = {
  randomSeed: string;
  startedAt: Date | null;
  endedAt: Date | null;
  gameId: string;
  timezone: string;
  members: GameSessionMember[];
  gameVersion: string;
};

export type GameSessionTurn = Turn<any>;

/**
 * These member stubs connect to User ids in the core database,
 * but don't store any redundant data about those users, which
 * is irrelevant to the game state. Look up the users from
 * the core database when needed.
 * These are objects to allow future extension if necessary.
 */
export type GameSessionMember = {
  id: PrefixedId<'u'>;
};

/**
 * Game Session State is responsible for storing the data required to compute
 * the state of a game session at any given time. This includes the game
 * seed, the turns applied, and the canonical game members.
 */
export class GameSessionState extends DurableObject<Env> {
  #sessionData: GameSessionBaseData | null = null;
  #turns: GameSessionTurn[] = [];
  #chat: GameSessionChatMessage[] = [];
  /**
   * Precomputed global states per-round
   */
  #globalStateCache: unknown[] = [];
  #miniApp;
  #socketInfo = new Map<
    WebSocket,
    { gameSessionId: string; userId: PrefixedId<'u'> }
  >();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // load initial state from storage
    ctx.blockConcurrencyWhile(async () => {
      this.#sessionData = (await ctx.storage.get('sessionData')) || null;
      this.#turns = (await ctx.storage.get('turns')) || [];
      this.#chat = (await ctx.storage.get('chat')) || [];
    });

    // if we've come back from hibernation, we have to repopulate our socket map
    ctx.getWebSockets().forEach((ws) => {
      const data = ws.deserializeAttachment();
      if (data) {
        this.#socketInfo.set(ws, data);
      }
    });

    // this mini Hono app handles websocket connections
    this.#miniApp = new Hono<{ Bindings: Env }>().all(
      '/:id/socket',
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
          ctx.env.SOCKET_TOKEN_SECRET,
        );

        assertPrefixedId(userId, 'u');

        const verifiedDOId =
          this.env.GAME_SESSION_STATE.idFromName(gameSessionId);
        if (verifiedDOId !== this.ctx.id) {
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            "Please don't try to hack us :(",
          );
        }

        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        this.ctx.acceptWebSocket(server);
        // attaching the data directly to the socket allows it to survive hibernation of this DO
        client.serializeAttachment({ gameSessionId, userId });

        // send events to all other clients to indicate the newly joined user. this happens
        // before info registration just for convenience so we don't need to filter out sending
        // back to the new socket.
        await this.#sendSocketMessage({
          type: 'playerConnected',
          playerId: userId,
        });

        // map the client socket to the token info for later reference.
        this.#socketInfo.set(client, { gameSessionId, userId });

        // TODO: send chat backlog to the new user

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      },
    );
  }

  async fetch(request: Request) {
    return this.#miniApp.fetch(request);
  }

  private get gameDefinition() {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const { gameId, gameVersion } = this.#sessionData;
    const gameModule = games[gameId];
    if (!gameModule) {
      throw new Error(`Game module for ${gameId} not found`);
    }

    const gameDefinition = gameModule.versions.find(
      (v) => v.version === gameVersion,
    );

    if (!gameDefinition) {
      throw new Error(`Game version ${gameVersion} not found`);
    }

    return gameDefinition;
  }

  private setSessionData(data: Partial<GameSessionBaseData>) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    this.#sessionData = {
      ...this.#sessionData,
      ...data,
    };
    this.ctx.storage.put('sessionData', this.#sessionData);
  }

  /**
   * Called once to store critical initial data
   * for the game.
   */
  initialize(
    data: Pick<
      GameSessionBaseData,
      'randomSeed' | 'gameId' | 'gameVersion' | 'members' | 'timezone'
    >,
  ) {
    this.#sessionData = {
      startedAt: null,
      endedAt: null,
      ...data,
    };
    this.ctx.storage.put('sessionData', this.#sessionData);
  }

  updateMembers(members: GameSessionMember[]) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.#sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update members after game has started',
      );
    }
    this.setSessionData({ members });
  }

  updateGame(gameId: string, gameVersion: string) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.#sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update game after game has started',
      );
    }
    this.setSessionData({ gameId, gameVersion });
  }

  startGame() {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    // last chance to update the game version before beginning play
    const gameModule = games[this.#sessionData.gameId];
    if (!gameModule) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game module not found',
      );
    }

    const gameDefinition = getLatestVersion(gameModule);
    this.updateGame(this.#sessionData.gameId, gameDefinition.version);

    // start the game
    this.setSessionData({ startedAt: new Date() });
  }

  getIsInitialized(): boolean {
    return Boolean(this.#sessionData);
  }

  getCurrentRoundIndex(): number {
    if (!this.#sessionData?.startedAt) {
      return 0;
    }
    return this.gameDefinition.getRoundIndex({
      currentTime: new Date(),
      gameTimeZone: this.#sessionData.timezone,
      members: this.#sessionData.members,
      startedAt: this.#sessionData.startedAt,
      turns: this.#turns,
    });
  }

  /**
   * Computes turns into grouped rounds, optionally up to (not including)
   * the specified round
   */
  getRounds({
    upTo,
  }: {
    upTo?: number | 'current';
  } = {}): GameRound<GameSessionTurn>[] {
    const resolvedUpTo =
      upTo === 'current' ? this.getCurrentRoundIndex() : upTo;
    // group turns into rounds, providing up to the specified round if needed
    return this.#turns.reduce<GameRound<GameSessionTurn>[]>((acc, turn) => {
      if (resolvedUpTo !== undefined && turn.roundIndex >= resolvedUpTo) {
        return acc;
      }
      const round = acc[turn.roundIndex] ?? {
        roundIndex: turn.roundIndex,
        turns: [],
      };
      round.turns.push(turn);
      acc[turn.roundIndex] = round;
      return acc;
    }, []);
  }

  /**
   * Get the public state for a particular player at a particular round.
   * Defaults to current round.
   */
  getPlayerState(playerId: PrefixedId<'u'>, roundIndex?: number): any {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const currentRoundIndex = this.getCurrentRoundIndex();
    if (roundIndex && roundIndex >= currentRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    const resolvedRoundIndex = roundIndex ?? currentRoundIndex - 1;
    const globalState = this.getGlobalState(roundIndex);
    return this.gameDefinition.getPlayerState({
      globalState,
      playerId,
      roundIndex: resolvedRoundIndex,
      members: this.#sessionData.members,
      rounds: this.getRounds({ upTo: resolvedRoundIndex + 1 }),
    });
  }

  getPublicRounds(playerId: PrefixedId<'u'>, { upTo }: { upTo?: number } = {}) {
    const currentRoundIndex = this.getCurrentRoundIndex();
    if (upTo && upTo >= currentRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    const resolvedUpTo = upTo ?? currentRoundIndex - 1;
    return this.getRounds({ upTo: resolvedUpTo }).map((round) => {
      return {
        ...round,
        turns: round.turns.map((turn) => {
          return this.gameDefinition.getPublicTurn({
            turn,
            globalState: this.getGlobalState(round.roundIndex),
            viewerId: playerId,
          });
        }),
      };
    });
  }

  /**
   * Get the global state for a particular round. Defaults to current round.
   */
  getGlobalState(roundIndex?: number): any {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const random = new GameRandom(this.#sessionData.randomSeed);
    const initialState = this.gameDefinition.getInitialGlobalState({
      random,
      members: this.#sessionData.members,
    });
    // check cache first. we never cache the current round (since it's mutable)
    // so we skip if no roundIndex is provided
    if (roundIndex && this.#globalStateCache[roundIndex]) {
      return this.#globalStateCache[roundIndex];
    }
    const computed = this.gameDefinition.getState({
      initialState,
      rounds: this.getRounds({ upTo: roundIndex }),
      random,
      members: this.#sessionData.members,
    });
    if (roundIndex) {
      this.#globalStateCache[roundIndex] = computed;
    }
    return computed;
  }

  /**
   * Shortcut to get the current round of turns.
   * NOTE: this is not public info.
   */
  getCurrentRound() {
    const currentRoundIndex = this.getCurrentRoundIndex();
    return this.getRound(currentRoundIndex);
  }

  /**
   * Gets a specific round of turns.
   * NOTE: this is not necessarily public info. Could be used to leak
   * current round if no validation is applied to prevent accessing
   * the current round index.
   */
  getRound(roundIndex: number): GameRound<GameSessionTurn> {
    return {
      turns: this.#turns.filter((turn) => turn.roundIndex === roundIndex),
      roundIndex,
    };
  }

  /**
   * Gets information relevant to the status of players in the current round.
   */
  getPlayerStatuses(): Record<string, { hasPlayed: boolean }> {
    const currentRound = this.getCurrentRound();
    return (this.#sessionData?.members ?? []).reduce<
      Record<string, { hasPlayed: boolean }>
    >((acc, member) => {
      acc[member.id] = {
        hasPlayed: currentRound.turns.some(
          (turn) => turn.playerId === member.id,
        ),
      };
      return acc;
    }, {});
  }

  /**
   * Adds (and stores) a turn to the game session for the current
   * round.
   */
  addTurn(playerId: PrefixedId<'u'>, turn: any) {
    const currentRoundIndex = this.getCurrentRoundIndex();
    this.#turns.push({
      roundIndex: currentRoundIndex,
      createdAt: new Date().toUTCString(),
      data: turn,
      playerId,
    });
    this.ctx.storage.put('turns', this.#turns);
  }

  getCurrentTurn(playerId: PrefixedId<'u'>): GameSessionTurn | null {
    const currentRoundIndex = this.getCurrentRoundIndex();
    return (
      this.#turns.find(
        (turn) =>
          turn.roundIndex === currentRoundIndex && turn.playerId === playerId,
      ) ?? {
        data: null,
        createdAt: new Date().toUTCString(),
        playerId,
        roundIndex: currentRoundIndex,
      }
    );
  }

  /**
   * Get the game status, which indicates game progress and outcome.
   */
  getStatus(): GameStatus {
    if (!this.#sessionData?.startedAt) {
      return {
        status: 'pending',
      };
    }

    return this.gameDefinition.getStatus({
      globalState: this.getGlobalState(),
      members: this.#sessionData.members,
      rounds: this.getRounds({ upTo: 'current' }),
    });
  }

  getSummary() {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session has not been initialized',
      );
    }
    return {
      id: this.ctx.id.toString(),
      status: this.getStatus(),
      members: this.#sessionData.members,
      playerStatuses: this.getPlayerStatuses(),
      gameId: this.#sessionData.gameId,
      gameVersion: this.#sessionData.gameVersion,
      currentRoundIndex: this.getCurrentRoundIndex(),
    };
  }

  addChatMessage(message: GameSessionChatMessage) {
    this.#chat.push(message);
    this.ctx.storage.put('chat', this.#chat);
  }

  getChatForPlayer(playerId: PrefixedId<'u'>): GameSessionChatMessage[] {
    return this.#chat.filter((message) => {
      if (message.recipientIds) {
        return message.recipientIds.includes(playerId);
      }
      return true;
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {}

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    ws.close(code, 'Goodbye');
    this.#onWebSocketCloseOrError(ws);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error('Websocket error', error);
    this.#onWebSocketCloseOrError(ws);
  }

  #onWebSocketCloseOrError = (ws: WebSocket) => {
    const info = this.#socketInfo.get(ws);
    if (info) {
      // inform other clients that this user has left
      this.#sendSocketMessage({
        type: 'playerDisconnected',
        playerId: info.userId,
      });
    }
    this.#socketInfo.delete(ws);
  };

  #sendSocketMessage = async (
    msg: ServerMessage,
    {
      to,
    }: {
      to?: PrefixedId<'u'>[];
    } = {},
  ) => {
    const sockets = Array.from(this.#socketInfo.entries());
    for (const [ws, { userId }] of sockets) {
      if (to && !to.includes(userId)) {
        continue;
      }
      ws.send(JSON.stringify(msg));
    }
  };
}

export default {
  fetch: api.fetch,
};
