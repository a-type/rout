import { zValidator } from '@hono/zod-validator';
import {
  assertPrefixedId,
  ClientMessage,
  ClientRequestChatMessage,
  ClientSendChatMessage,
  ClientSubmitTurnMessage,
  GameRound,
  GameRoundSummary,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  id,
  LongGameError,
  PrefixedId,
  ServerMessage,
} from '@long-game/common';
import {
  BaseTurnData,
  getGameState,
  getLatestVersion,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono/quick';
import { z } from 'zod';
import { verifySocketToken } from '../auth/socketTokens';
import { notifyUser } from '../services/notification';

/**
 * The basic initial data required to set up a game.
 */
export type GameSessionBaseData = {
  id: PrefixedId<'gs'>;
  randomSeed: string;
  startedAt: Date | null;
  endedAt: Date | null;
  gameId: string;
  timezone: string;
  members: GameSessionMember[];
  gameVersion: string;
  deleted: boolean;
};

export type GameSessionTurn = Turn<{}>;

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

interface GameSessionNotificationState {
  /**
   * Which players were notified, and when (UTC date string)
   */
  playersNotified: Record<PrefixedId<'u'>, string | null>;
  /**
   * If round index is out of date, this state should be
   * reset.
   */
  roundIndex: number;
}

type SocketSessionInfo = {
  gameSessionId: string;
  userId: PrefixedId<'u'>;
  socketId: string;
  status: 'pending' | 'ready' | 'closed';
};

/**
 * Game Session State is responsible for storing the data required to compute
 * the state of a game session at any given time. This includes the game
 * seed, the turns applied, and the canonical game members.
 */
export class GameSessionState extends DurableObject<ApiBindings> {
  // storage backed fields
  #sessionData: GameSessionBaseData | null = null;
  #turns: GameSessionTurn[] = [];
  #chat: GameSessionChatMessage[] = [];
  #notifications: GameSessionNotificationState = {
    roundIndex: 0,
    playersNotified: {},
  };

  // a little Hono instance to handle requests
  #miniApp;

  // memory fields
  #socketInfo = new Map<WebSocket, SocketSessionInfo>();
  // map of socket id -> messages waiting to be sent until socket is confirmed
  #messageBacklogs = new Map<string, ServerMessage[]>();

  constructor(ctx: DurableObjectState, env: ApiBindings) {
    super(ctx, env);

    // load initial state from storage
    ctx.blockConcurrencyWhile(async () => {
      this.#sessionData = (await ctx.storage.get('sessionData')) || null;
      this.#turns = (await ctx.storage.get('turns')) || [];
      this.#chat = (await ctx.storage.get('chat')) || [];
      this.#notifications = (await ctx.storage.get('notifications')) || {
        roundIndex: 0,
        playersNotified: {},
      };
    });

    // if we've come back from hibernation, we have to repopulate our socket map
    ctx.getWebSockets().forEach((ws) => {
      const data = ws.deserializeAttachment();
      if (data) {
        this.#socketInfo.set(ws, data);
      }
    });

    // this mini Hono app handles websocket connections
    this.#miniApp = new Hono().all(
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

        if (!this.#sessionData) {
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            'Session data not initialized',
          );
        }
        if (gameSessionId !== this.#sessionData.id) {
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
        this.updateSocketInfo(server, {
          gameSessionId,
          userId,
          status: 'pending',
          socketId: crypto.randomUUID(),
        });

        (async () => {
          // send connection notice to other players
          this.#sendSocketMessage({
            type: 'playerStatusChange',
            playerId: userId,
            playerStatus: {
              online: true,
            },
          });
          // send start of chat backlog to the new player (this will enqueue for delivery later)
          const { messages, nextToken } = this.getChatForPlayer(userId, {
            limit: 100,
          });
          if (messages.length) {
            this.#sendSocketMessage({
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
  }

  private updateSocketInfo(ws: WebSocket, info: SocketSessionInfo) {
    this.#socketInfo.set(ws, info);
    ws.serializeAttachment(info);
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

  private get orderedMembers() {
    return (this.#sessionData?.members ?? []).sort((a, b) =>
      a.id.localeCompare(b.id),
    );
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
      'id' | 'randomSeed' | 'gameId' | 'gameVersion' | 'members' | 'timezone'
    >,
  ) {
    this.#sessionData = {
      startedAt: null,
      endedAt: null,
      deleted: false,
      ...data,
    };
    this.ctx.storage.put('sessionData', this.#sessionData);
  }

  delete() {
    const status = this.getStatus().status;
    if (status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot delete a game session that is not pending',
      );
    }

    if (this.#sessionData) {
      this.#sessionData.deleted = true;
    }
    this.ctx.storage.deleteAll();
    this.ctx.storage.deleteAlarm();
  }

  updateMembers(members: GameSessionMember[]) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.#sessionData.startedAt) {
      // game is already started, but maybe this client didn't
      // get the message.
      this.#sendSocketMessage({
        type: 'statusChange',
        status: this.getStatus(),
      });
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update members after game has started',
      );
    }
    // make sure we don't store extra data here. we only
    // need the id
    this.setSessionData({
      members: members.map((m) => ({
        id: m.id,
      })),
    });
    this.#sendSocketMessage({
      type: 'membersChange',
      members: this.orderedMembers,
    });
  }

  updateGame(gameId: string, gameVersion: string) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.#sessionData.startedAt) {
      // game is already started, but maybe this client didn't
      // get the message.
      this.#sendSocketMessage({
        type: 'statusChange',
        status: this.getStatus(),
      });
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update game after game has started',
      );
    }
    this.setSessionData({ gameId, gameVersion });
    this.#sendSocketMessage({
      type: 'gameChange',
    });
  }

  startGame() {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }

    if (this.#sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session has already started',
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

    // update any connected sockets of the new status
    this.#sendSocketMessage({
      type: 'statusChange',
      status: this.getStatus(),
    });

    this.#sendOrScheduleNotifications();
  }

  getIsInitialized(): boolean {
    return Boolean(this.#sessionData);
  }

  #getCurrentRoundState() {
    if (!this.#sessionData?.startedAt) {
      return {
        roundIndex: 0,
        pendingTurns: [],
        checkAgainAt: null,
      };
    }
    const latestRoundFromTurns = Math.max(
      0,
      ...this.#turns.map((t) => t.roundIndex),
    );
    return this.gameDefinition.getRoundIndex({
      currentTime: new Date(),
      gameTimeZone: this.#sessionData.timezone,
      members: this.orderedMembers,
      startedAt: this.#sessionData.startedAt,
      turns: this.#turns,
      // WARNING: do not remove parameter.
      // providing a set index here prevents recursion (by default
      // getGlobalStateUnchecked uses this method, getCurrentRoundIndex)
      globalState: this.#getGlobalStateUnchecked(latestRoundFromTurns),
      environment: this.env.DEV_MODE ? 'development' : 'production',
    });
  }
  /**
   * Computed method! Store the returned value if possible for reuse.
   * Returns the active round index. 0 is the first round.
   * Note that despite this value being the current round,
   * all information delivered to the player should use
   * getPublicRoundIndex, which is 1 behind. The current round
   * will include submitted turns before the round is complete.
   */
  getCurrentRoundIndex() {
    return this.#getCurrentRoundState().roundIndex;
  }

  getPublicRoundIndex(): number {
    return this.getCurrentRoundIndex() - 1;
  }

  /**
   * Computes turns into grouped rounds, optionally up to (and including)
   * the specified round
   */
  getRounds({
    upTo,
  }: {
    /**
     * INCLUSIVE round index to stop at. If not provided, all rounds are returned.
     */
    upTo?: number | 'current';
  } = {}): GameRound<GameSessionTurn>[] {
    const resolvedUpTo =
      upTo === 'current' ? this.getCurrentRoundIndex() : upTo;
    // group turns into rounds, providing up to the specified round if needed
    return this.#turns.reduce<GameRound<GameSessionTurn>[]>((acc, turn) => {
      if (resolvedUpTo !== undefined && turn.roundIndex > resolvedUpTo) {
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
   * Returns all PRIVATE turns for the game session. This is privileged
   * info only externally accessible in dev mode.
   */
  getTurns() {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (!this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access private turns outside of dev mode',
      );
    }
    return this.#turns;
  }

  /**
   * Get the public state for a particular player at a particular round.
   * Defaults to current round.
   */
  getPlayerState(playerId: PrefixedId<'u'>, roundIndex?: number): any {
    const currentRoundIndex = this.getCurrentRoundIndex();
    if (roundIndex && roundIndex >= currentRoundIndex && !this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    return this.getPlayerStateUnchecked(playerId, roundIndex);
  }

  // unvalidated versions
  getPlayerStateUnchecked(playerId: PrefixedId<'u'>, roundIndex?: number) {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const publicRoundIndex = this.getPublicRoundIndex();
    const resolvedRoundIndex = roundIndex ?? publicRoundIndex;
    const globalState = this.#getGlobalStateUnchecked(roundIndex);
    const rounds = this.getRounds({ upTo: resolvedRoundIndex });
    const playerTurn =
      rounds[resolvedRoundIndex]?.turns.find((t) => t.playerId === playerId) ||
      null;
    return this.gameDefinition.getPlayerState({
      globalState,
      playerId,
      members: this.orderedMembers,
      rounds,
      roundIndex: rounds.length,
      playerTurn,
    }) as any;
  }

  getPublicRounds(playerId: PrefixedId<'u'>, { upTo }: { upTo?: number } = {}) {
    const publicRoundIndex = this.getPublicRoundIndex();
    if (upTo && upTo > publicRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    const resolvedUpTo = upTo ?? publicRoundIndex;
    return this.getRounds({ upTo: resolvedUpTo }).map((round) => {
      return {
        ...round,
        turns: round.turns.map((turn) => {
          return this.gameDefinition.getPublicTurn({
            turn,
            globalState: this.#getGlobalStateUnchecked(round.roundIndex),
            viewerId: playerId,
          });
        }),
      };
    });
  }

  getPublicRound(
    playerId: PrefixedId<'u'>,
    roundIndex: number,
  ): GameRoundSummary<{}, {}, {}> {
    const currentRoundIndex = this.getCurrentRoundIndex();
    if (roundIndex > currentRoundIndex && !this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    const round = this.getRound(roundIndex);
    const globalState = this.#getGlobalStateUnchecked(roundIndex);
    const playerState = this.getPlayerStateUnchecked(playerId, roundIndex - 1);
    return {
      ...round,
      initialPlayerState: playerState as {},
      yourTurnData:
        round.turns.find((t) => t.playerId === playerId)?.data ?? null,
      turns: round.turns.map((turn) => {
        // do not show turn data for the current round, only show which players have
        // played a turn.
        if (roundIndex === currentRoundIndex) {
          return {
            playerId: turn.playerId,
            data: null,
          };
        }
        return this.gameDefinition.getPublicTurn({
          turn,
          globalState,
          viewerId: playerId,
        });
      }),
    };
  }

  /**
   * Get the global state for a particular round. Defaults to current round.
   */
  #getGlobalStateUnchecked(roundIndex?: number): unknown {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const rounds = this.getRounds({ upTo: roundIndex });
    const computed = getGameState(this.gameDefinition, {
      rounds,
      randomSeed: this.#sessionData.randomSeed,
      members: this.orderedMembers,
    });
    return computed;
  }

  /**
   * User-facing ability to get global state after game has ended.
   */
  getGlobalState(): unknown {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.getStatus().status !== 'completed' && !this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session has not ended yet',
      );
    }
    return this.#getGlobalStateUnchecked();
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
  getPlayerStatuses(): Record<string, GameSessionPlayerStatus> {
    return (this.#sessionData?.members ?? []).reduce<
      Record<string, GameSessionPlayerStatus>
    >((acc, member) => {
      acc[member.id] = {
        online: this.#socketInfo.values().some((v) => v.userId === member.id),
      };
      return acc;
    }, {});
  }

  getPlayerLatestPlayedRoundIndex(playerId: PrefixedId<'u'>) {
    return Math.max(
      ...this.#turns
        .filter((turn) => turn.playerId === playerId)
        .map((turn) => turn.roundIndex),
    );
  }

  /**
   * Call after material changes are made to the game
   * state. This will recompute the round and send or
   * schedule notifications to players.
   */
  #sendOrScheduleNotifications = async () => {
    const roundState = this.#getCurrentRoundState();
    if (roundState.roundIndex !== this.#notifications.roundIndex) {
      // reset notifications state
      this.#notifications.roundIndex = roundState.roundIndex;
      this.#notifications.playersNotified = {};
    }
    // check if we need to notify players
    for (const playerId of roundState.pendingTurns) {
      if (!this.#notifications.playersNotified[playerId]) {
        try {
          await this.#notifyPlayerOfTurn(playerId);
          // mark notified
          this.#notifications.playersNotified[playerId] =
            new Date().toUTCString();
        } catch (err) {
          console.error(
            `Failed to send player notification to ${playerId}`,
            err,
          );
        }
      } else {
        console.log(`Player ${playerId} already notified of turn, skipping`);
      }
    }
    this.ctx.storage.put('notifications', this.#notifications);
    // schedule any required alarm
    if (roundState.checkAgainAt) {
      console.log(
        `Scheduling status recheck alarm for ${roundState.checkAgainAt}`,
      );
      this.ctx.storage.setAlarm(roundState.checkAgainAt.getTime());
    }
  };

  async #notifyPlayerOfTurn(playerId: PrefixedId<'u'>) {
    // if player is connected with a live socket, we don't need
    // to send a push.
    if (
      this.#socketInfo
        .values()
        .some((v) => v.userId === playerId && v.status === 'ready')
    ) {
      console.info(
        `Player ${playerId} is connected over socket, not sending push`,
      );
      return;
    }

    console.info(`Notifying player ${playerId} of turn`);
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Session data not initialized',
      );
    }
    await notifyUser(
      playerId,
      {
        type: 'turn-ready',
        gameId: this.#sessionData.gameId,
        gameSessionId: this.#sessionData.id,
        id: id('no'),
      },
      this.env,
    );
  }

  async alarm() {
    if (this.#sessionData?.deleted) {
      // don't bother
      return;
    }
    this.#sendOrScheduleNotifications();
  }

  /**
   * Adds (and stores) a turn to the game session for the current
   * round.
   */
  addTurn(playerId: PrefixedId<'u'>, turn: BaseTurnData) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session has not been initialized',
      );
    }

    if (this.getStatus().status !== 'active') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Game is ${this.getStatus().status}, cannot play a turn`,
      );
    }

    const validationError = this.gameDefinition.validateTurn({
      members: this.orderedMembers,
      turn: {
        data: turn,
        playerId,
      },
      playerState: this.getPlayerState(playerId, this.getPublicRoundIndex()),
      roundIndex: this.getCurrentRoundIndex(),
    });
    if (validationError) {
      throw new LongGameError(LongGameError.Code.BadRequest, validationError);
    }
    const currentRoundIndex = this.getCurrentRoundIndex();
    console.log(`Adding turn for ${playerId} in round ${currentRoundIndex}`);

    const newTurn = {
      roundIndex: currentRoundIndex,
      createdAt: new Date().toUTCString(),
      data: turn,
      playerId,
    };

    // replace existing user turn if they have one this round. we let
    // users update their turns until the round is over.
    const existingTurnIndex = this.#turns.findIndex(
      (t) => t.roundIndex === currentRoundIndex && t.playerId === playerId,
    );
    if (existingTurnIndex !== -1) {
      this.#turns[existingTurnIndex] = newTurn;
    } else {
      this.#turns.push(newTurn);
    }
    this.ctx.storage.put('turns', this.#turns);

    this.#sendSocketMessage({
      type: 'turnPlayed',
      roundIndex: currentRoundIndex,
      turn: {
        playerId,
        // turn data for current round is not public.
        data: null,
      },
    });

    // see if this turn completed the round
    const newRoundIndex = this.getCurrentRoundIndex();
    if (newRoundIndex > currentRoundIndex) {
      // see if the game is over
      const status = this.getStatus();
      if (status.status === 'completed') {
        this.#sendSocketMessage({
          type: 'statusChange',
          status,
        });
      }
      // broadcast the new round to all players even if game is over. this will
      // allow players to see the final state of the game while in-session.
      this.#broadcastRoundChange(newRoundIndex);
    }

    this.#sendOrScheduleNotifications();
  }

  #broadcastRoundChange = (roundIndex: number) => {
    console.log('Broadcasting round change to all players', roundIndex);
    for (const member of this.#sessionData?.members ?? []) {
      this.#sendSocketMessage(
        {
          type: 'roundChange',
          completedRound: this.getPublicRound(member.id, roundIndex - 1),
          newRound: this.getPublicRound(member.id, roundIndex),
        },
        { to: [member.id] },
      );
    }
  };

  getCurrentTurn(playerId: PrefixedId<'u'>): {
    data: any;
    roundIndex: number;
    playerId: PrefixedId<'u'>;
  } {
    const currentRoundIndex = this.getCurrentRoundIndex();
    return (
      this.#turns.find(
        (turn) =>
          turn.roundIndex === currentRoundIndex && turn.playerId === playerId,
      ) ?? {
        data: null,
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

    // status is for publicly available data, not internal data
    const publicRoundIndex = this.getPublicRoundIndex();
    // otherwise we'd end the game as soon as one player played a turn
    // that met conditions. this way we wait for the round to complete.
    return this.gameDefinition.getStatus({
      globalState: this.#getGlobalStateUnchecked(),
      members: this.orderedMembers,
      rounds: this.getRounds({ upTo: publicRoundIndex }),
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
      id: this.#sessionData.id,
      status: this.getStatus(),
      gameId: this.#sessionData.gameId,
      gameVersion: this.#sessionData.gameVersion,
      members: this.orderedMembers,
      startedAt: this.#sessionData.startedAt?.getTime() ?? 0,
      timezone: this.#sessionData.timezone,
    };
  }

  getDetails(userId: PrefixedId<'u'>) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session has not been initialized',
      );
    }
    const summary = this.getSummary();
    const currentRoundIndex = this.getCurrentRoundIndex();
    return {
      ...summary,
      playerId: userId,
      playerState: this.getPlayerState(userId) as {},
      currentRound: this.getPublicRound(userId, currentRoundIndex),
      playerStatuses: this.getPlayerStatuses(),
    };
  }

  addChatMessage(message: GameSessionChatMessage) {
    this.#chat.push(message);
    this.#chat.sort((a, b) => a.createdAt - b.createdAt);
    this.ctx.storage.put('chat', this.#chat);
    // publish to all sockets
    this.#sendSocketMessage({
      type: 'chat',
      messages: [message],
    });
  }

  getChatForPlayer(
    playerId: PrefixedId<'u'>,
    pagination: {
      limit: number;
      nextToken?: string | null;
    } = { limit: 100 },
  ): { messages: GameSessionChatMessage[]; nextToken: string | null } {
    const slice: GameSessionChatMessage[] = [];
    const before = pagination.nextToken
      ? parseInt(pagination.nextToken, 10)
      : null;
    const roundIndex = this.getPublicRoundIndex();
    const status = this.getStatus();

    let nextToken: string | null = null;
    for (let i = this.#chat.length - 1; i >= 0; i--) {
      const message = this.#chat[i];
      if (before && message.createdAt < before) {
        nextToken = message.createdAt.toString();
        break;
      }
      if (this.#canPlayerSeeChat(playerId, message, roundIndex, status)) {
        slice.push(message);
      }
      if (slice.length === pagination?.limit) {
        const nextMessage = this.#chat[i - 1];
        if (nextMessage) {
          nextToken = nextMessage.createdAt.toString();
        }
        break;
      }
    }

    return { messages: slice, nextToken };
  }

  #canPlayerSeeChat(
    playerId: PrefixedId<'u'>,
    message: GameSessionChatMessage,
    roundIndex: number,
    status: GameStatus,
  ) {
    // players always see their own messages no matter what!
    if (message.authorId === playerId) {
      return true;
    }
    if (message.roundIndex !== undefined) {
      if (message.roundIndex > roundIndex) {
        return false;
      }
      if (message.roundIndex === -1 && status.status !== 'completed') {
        return false;
      }
    }
    if (message.recipientIds && !message.recipientIds.includes(playerId)) {
      return false;
    }
    return true;
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
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
      this.updateSocketInfo(ws, { ...info, status: 'ready' });
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
    const parsed = JSON.parse(message.toString()) as ClientMessage;
    this.#onClientMessage(parsed, ws, info);
  }

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
        case 'resetGame':
          await this.#onResetGame(msg, ws, info);
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

  #onClientSendChat = async (
    msg: ClientSendChatMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    const { content, recipientIds, position, sceneId, roundIndex } =
      msg.message;
    const message: GameSessionChatMessage = {
      id: id('cm'),
      createdAt: Date.now(),
      authorId: info.userId,
      content,
      recipientIds,
      position,
      sceneId,
      roundIndex,
    };
    this.addChatMessage(message);
  };

  #onClientSubmitTurn = async (
    msg: ClientSubmitTurnMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    console.log(`Received turn from ${info.userId}`, msg.turnData);
    this.addTurn(info.userId, msg.turnData);
  };

  #onClientRequestChat = async (
    msg: ClientRequestChatMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    const { messages, nextToken } = this.getChatForPlayer(info.userId, {
      limit: 100,
      nextToken: msg.nextToken,
    });
    this.#sendSocketMessage({
      type: 'chat',
      messages,
      nextToken,
      responseTo: msg.messageId,
    });
  };

  #onResetGame = async (
    msg: ClientMessage,
    ws: WebSocket,
    info: SocketSessionInfo,
  ) => {
    if (!this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot reset game in production',
      );
    }
    this.#turns = [];
    this.#notifications = {
      roundIndex: 0,
      playersNotified: {},
    };
    this.ctx.storage.put('turns', this.#turns);
    this.ctx.storage.put('notifications', this.#notifications);
    this.#sendSocketMessage({
      type: 'gameChange',
      responseTo: msg.messageId,
    });
  };

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
        type: 'playerStatusChange',
        playerId: info.userId,
        playerStatus: {
          online: false,
        },
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
    for (const [ws, { userId, status, socketId }] of sockets) {
      if (to && !to.includes(userId)) {
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
        // console.log('backlogged message for socket', socketId, userId, backlog);
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
}
