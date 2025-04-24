import { EventSubscriber } from '@a-type/utils';
import {
  GameRoundSummary,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  LongGameError,
  PlayerColorName,
  PrefixedId,
  ServerChatMessage,
  ServerGameMembersChangeMessage,
  ServerPlayerStatusChangeMessage,
  ServerRoundChangeMessage,
  ServerStatusChangeMessage,
  ServerTurnPlayedMessage,
} from '@long-game/common';
import {
  GameDefinition,
  GetGlobalState,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { action, autorun, computed, observable, runInAction, toJS } from 'mobx';
import {
  getDevModeTurns,
  getPlayers,
  getPostgame,
  getPublicRound,
  getSummary,
} from './api.js';
import { GameSocket } from './socket.js';

export type PlayerInfo = {
  id: PrefixedId<'u'>;
  displayName: string;
  imageUrl: string | null;
  color: PlayerColorName;
};

type GameSessionSuiteEvents = {
  turnPlayed: () => void;
  turnPrepared: () => void;
  turnValidationFailed: (error: string) => void;
  error: (error: LongGameError) => void;
  roundChanged: () => void;
};

export class GameSessionSuite<TGame extends GameDefinition> {
  #instanceId = Math.random().toString(36).slice(2);
  @observable accessor localTurnData!: GetTurnData<TGame> | null;
  @observable accessor playerStatuses!: Record<
    PrefixedId<'u'>,
    GameSessionPlayerStatus
  >;
  @observable accessor players!: Record<PrefixedId<'u'>, PlayerInfo>;
  @observable accessor chat: GameSessionChatMessage[] = [];
  @observable accessor gameStatus!: GameStatus;
  @observable accessor rounds: GameRoundSummary<
    GetTurnData<TGame>,
    GetPublicTurnData<TGame>,
    GetPlayerState<TGame>
  >[] = [];
  @observable accessor viewingRoundIndex = 0;
  @observable accessor suspended: Promise<void> | null = null;
  @observable accessor postgameGlobalState: GetGlobalState<TGame> | null = null;

  // static
  gameId!: string;
  gameVersion!: string;
  gameSessionId: PrefixedId<'gs'>;
  gameDefinition!: TGame;
  members!: { id: PrefixedId<'u'> }[];
  playerId: PrefixedId<'u'>;
  startedAt!: Date;
  timezone!: string;
  #events = new EventSubscriber<GameSessionSuiteEvents>();

  // non-reactive
  #chatNextToken: string | null = null;

  constructor(
    init: {
      playerState: GetPlayerState<TGame>;
      currentRound: GameRoundSummary<
        GetTurnData<TGame>,
        GetPublicTurnData<TGame>,
        GetPlayerState<TGame>
      >;
      playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
      gameId: string;
      gameVersion: string;
      id: PrefixedId<'gs'>;
      members: { id: PrefixedId<'u'> }[];
      status: GameStatus;
      playerId: PrefixedId<'u'>;
      startedAt: number;
      timezone: string;
    },
    private ctx: {
      socket: GameSocket;
    },
  ) {
    console.trace(
      'GameSessionSuite constructor',
      this.#instanceId,
      'socket',
      ctx.socket.id,
    );
    this.playerId = init.playerId;
    this.gameSessionId = init.id;

    this.applyGameData(init);

    this.subscribeSocket();
    this.setupLocalTurnStorage();

    if (init.status.status === 'completed') {
      this.suspended = this.loadPostgame();
    }
  }

  connect = () => {
    console.log(
      'connecting...',
      this.#instanceId,
      'socket',
      this.ctx.socket.id,
    );
    return this.ctx.socket.reconnect();
  };
  disconnect = () => {
    console.log(
      'disconnecting...',
      this.#instanceId,
      'socket',
      this.ctx.socket.id,
    );
    this.ctx.socket.disconnect();
  };

  get subscribe() {
    return this.#events.subscribe;
  }

  @computed get viewingRound() {
    return this.rounds[this.viewingRoundIndex];
  }

  @computed get latestRoundIndex() {
    return this.rounds.length - 1;
  }

  @computed get latestRound() {
    return this.rounds[this.latestRoundIndex];
  }

  /**
   * The starting state for the currently viewed round, aka the final
   * state of the prior round.
   */
  @computed get initialState(): GetPlayerState<TGame> {
    return this.viewingRound.initialPlayerState;
  }

  /**
   * The final state for the currently viewed round.  When viewing the current round,
   * this is the initial state, since no turns have been played. After
   * your local turn has been played, this reflects the prospective
   * result of that turn (with no other player turns considered). Once the round
   * is resolved, it will be updated.
   */
  @computed get finalState(): GetPlayerState<TGame> {
    const { latestRoundIndex, viewingRoundIndex, currentTurn } = this;
    const viewingRound = this.rounds[viewingRoundIndex];
    const nextRound = this.rounds[viewingRoundIndex + 1];

    if (viewingRoundIndex === latestRoundIndex) {
      // for current round, apply prospective turn to initial state
      if (!currentTurn) return viewingRound.initialPlayerState;

      return this.gameDefinition.getProspectivePlayerState({
        playerState: viewingRound.initialPlayerState,
        prospectiveTurn: {
          data: currentTurn,
          playerId: this.playerId,
        },
        playerId: this.playerId,
      });
    }

    // since historical rounds need to be loaded, we may not have the next
    // round available, theoretically. Implementation should prevent this
    // from actually being rendered, but either way, we should handle it.
    // Presently, we just return the initial state.
    if (!nextRound) {
      return this.initialState;
    }
    return nextRound.initialPlayerState;
  }

  @computed get currentTurn() {
    const { localTurnData: localTurn, latestRound } = this;
    const remoteTurn = latestRound.yourTurnData;

    if (localTurn) return localTurn;
    if (remoteTurn) return remoteTurn;
    return null;
  }

  /**
   * If the viewed round is the active round, this will
   * include a locally drafted turn. Otherwise, it will
   * show your turn from the historical round, if you had one.
   */
  @computed get viewingTurn(): GetTurnData<TGame> | null {
    const { viewingRound, localTurnData, latestRound } = this;

    if (viewingRound.roundIndex === latestRound.roundIndex) {
      return localTurnData ?? viewingRound.yourTurnData;
    }
    return viewingRound.yourTurnData;
  }

  @computed get isViewingCurrentRound() {
    return this.viewingRoundIndex === this.latestRoundIndex;
  }

  @computed get turnWasSubmitted() {
    return !!this.latestRound.yourTurnData;
  }

  /**
   * Even if the player submitted a turn for this round,
   * this will tell you if they've made changes since and
   * need to resubmit to the server.
   */
  @computed get canSubmitTurn() {
    return !!this.localTurnData;
  }

  @computed get turnError() {
    const baseState = this.latestRound.initialPlayerState;
    const roundIndex = this.latestRound.roundIndex;
    if (!this.localTurnData) return null;
    return (
      this.gameDefinition.validateTurn({
        members: this.members,
        playerState: baseState,
        roundIndex,
        turn: {
          playerId: this.playerId,
          data: this.localTurnData,
        },
      }) || null
    );
  }

  @computed get combinedLog() {
    const chat = this.chat;
    // todo: round history
    // const rounds = this.rounds;
    return chat.map((msg) => ({
      type: 'chat' as const,
      chatMessage: msg,
      timestamp: msg.createdAt,
    }));
  }

  getPlayer = (id: PrefixedId<'u'>) => {
    return (
      this.players[id] ?? {
        id,
        displayName: 'Loading...',
        imageUrl: null,
        color: 'gray',
      }
    );
  };

  @action prepareTurn = (
    turn:
      | GetTurnData<TGame>
      | ((current: GetTurnData<TGame> | null) => GetTurnData<TGame>),
  ) => {
    if (typeof turn === 'function') {
      this.localTurnData = (turn as any)(this.localTurnData ?? null);
    } else {
      this.localTurnData = turn;
    }
    this.#events.emit('turnPrepared');
  };

  @action submitTurn = async (override?: GetTurnData<TGame>) => {
    if (override) {
      this.prepareTurn(override);
    }
    const localTurnData = this.localTurnData;
    if (!localTurnData) {
      return 'Play a turn first!';
    }
    const error = this.turnError;
    if (error) {
      this.#events.emit('turnValidationFailed', error);
      return error;
    }
    const submittingToRound = this.latestRoundIndex;
    const response = await this.ctx.socket.request({
      type: 'submitTurn',
      turnData: localTurnData,
    });
    if (response.type === 'error') {
      this.#events.emit(
        'error',
        new LongGameError(LongGameError.Code.Unknown, response.message),
      );
      return response.message;
    } else {
      // locally update the submitted round with our turn and
      // reset local turn data
      runInAction(() => {
        this.rounds[submittingToRound].yourTurnData = localTurnData;
        this.localTurnData = null;
      });
      this.#events.emit('turnPlayed');
    }
  };

  @action sendChat = async (message: {
    content: string;
    recipientIds?: PrefixedId<'u'>[];
    position?: { x: number; y: number };
    sceneId?: string;
    roundIndex?: number;
  }) => {
    const tempId = `cm-pending-${Math.random().toString().slice(2)}` as const;
    this.addChat({
      id: tempId,
      createdAt: Date.now(),
      authorId: this.playerId,
      ...message,
    });
    await this.ctx.socket.request({
      type: 'sendChat',
      message,
    });
    this.removeChat(tempId);
  };

  @action loadMoreChat = async () => {
    if (this.#chatNextToken) {
      this.ctx.socket.send({
        type: 'requestChat',
        nextToken: this.#chatNextToken,
      });
    }
  };

  @action loadRound = async (roundIndex: number) => {
    if (roundIndex < 0 || roundIndex > this.latestRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Cannot get data for round ${roundIndex}. Current round is ${this.latestRoundIndex}`,
      );
    }

    this.suspended = getPublicRound<TGame>(this.gameSessionId, roundIndex).then(
      action((res) => {
        this.rounds[roundIndex] = res;
      }),
    );
    return this.suspended;
  };

  @action showRound = async (roundIndex: number) => {
    if (!this.rounds[roundIndex]) {
      await this.loadRound(roundIndex);
    }

    this.viewingRoundIndex = roundIndex;
  };

  private subscribeSocket = () => {
    this.ctx.socket.subscribe('chat', this.onChat);
    this.ctx.socket.subscribe('playerStatusChange', this.onPlayerStatusChange);
    this.ctx.socket.subscribe('roundChange', this.onRoundChange);
    this.ctx.socket.subscribe('statusChange', this.onStatusChange);
    this.ctx.socket.subscribe('gameChange', this.onGameChange);
    this.ctx.socket.subscribe('membersChange', this.onMembersChange);
    this.ctx.socket.subscribe('turnPlayed', this.onTurnPlayed);
  };

  private onChat = (msg: ServerChatMessage) => {
    msg.messages.forEach(this.addChat);
    if (msg.nextToken !== undefined) {
      this.#chatNextToken = msg.nextToken;
    }
  };

  @action private addChat = (msg: GameSessionChatMessage) => {
    this.chat.push(msg);
    this.chat.sort((a, b) => a.createdAt - b.createdAt);
    this.chat = this.chat.filter((msg, i, arr) => {
      if (i === 0) {
        return true;
      }
      return msg.id !== arr[i - 1].id;
    });
  };

  @action private removeChat = (id: string) => {
    this.chat = this.chat.filter((msg) => msg.id !== id);
  };

  @action private onPlayerStatusChange = (
    msg: ServerPlayerStatusChangeMessage,
  ) => {
    this.playerStatuses[msg.playerId] = msg.playerStatus;
  };

  @action private onRoundChange = (msg: ServerRoundChangeMessage) => {
    // always best to update our data regardless; server knows best.
    this.rounds[msg.completedRound.roundIndex] = msg.completedRound;
    this.rounds[msg.newRound.roundIndex] = msg.newRound;
    // reset turn data for new round
    this.localTurnData = null;

    // update current state if the round has advanced and we were viewing
    // the current round
    if (this.viewingRoundIndex === msg.completedRound.roundIndex) {
      this.viewingRoundIndex = msg.newRound.roundIndex;
    }

    this.#events.emit('roundChanged');
  };

  @action private onStatusChange = (msg: ServerStatusChangeMessage) => {
    this.gameStatus = msg.status;
    // prefetch postgame when status is completed
    if (msg.status.status === 'completed') {
      this.suspended = this.loadPostgame();
    }
  };

  @action private onTurnPlayed = (msg: ServerTurnPlayedMessage) => {
    console.log('turn played', msg);
    // update the round with the new turn data
    const round = this.rounds[msg.roundIndex];
    if (round) {
      // replace the turn data for the player
      const playerId = msg.turn.playerId;
      const turnData = msg.turn.data;
      const playerIndex = round.turns.findIndex((t) => t.playerId === playerId);
      if (playerIndex === -1) {
        round.turns.push({ playerId, data: turnData as any });
      } else {
        round.turns[playerIndex] = { playerId, data: turnData as any };
      }
    }
  };

  @action loadPostgame = async () => {
    const postgame = await getPostgame(this.gameSessionId);
    this.postgameGlobalState = postgame.globalState;
  };

  private fetchMembers = async () => {
    const members = await getPlayers(this.gameSessionId);
    members.forEach(
      action((member: any) => {
        this.players[member.id] = member;
      }),
    );
  };

  @action private setupLocalTurnStorage = () => {
    const key = `game-session-${this.gameSessionId}-local-turn-${this.playerId}`;
    const localTurn = localStorage.getItem(key);
    if (localTurn) {
      this.localTurnData = JSON.parse(localTurn);
    }
    autorun(() => {
      localStorage.setItem(key, JSON.stringify(this.localTurnData));
    });
  };

  @action private onGameChange = async () => {
    const newData = await getSummary(this.gameSessionId);
    this.applyGameData(newData);
  };

  @action private applyGameData = (init: {
    playerState: any;
    currentRound: GameRoundSummary<any, any, any>;
    playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
    gameId: string;
    gameVersion: string;
    status: GameStatus;
    members: { id: PrefixedId<'u'> }[];
    startedAt: number;
    timezone: string;
  }) => {
    this.gameDefinition = games[init.gameId].versions.find(
      (v) => v.version === init.gameVersion,
    ) as TGame;
    if (!this.gameDefinition) {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Game definition not found',
      );
    }
    this.viewingRoundIndex = init.currentRound.roundIndex;
    this.localTurnData = null;
    this.rounds = new Array(init.currentRound.roundIndex).fill(null);
    this.rounds[init.currentRound.roundIndex] = init.currentRound;
    this.playerStatuses = init.playerStatuses;
    this.gameId = init.gameId;
    this.gameVersion = init.gameVersion;
    this.members = init.members;
    this.gameStatus = init.status;
    this.startedAt = new Date(init.startedAt);
    this.timezone = init.timezone;
    this.players = init.members.reduce<Record<PrefixedId<'u'>, PlayerInfo>>(
      (acc, member) => {
        acc[member.id] = {
          id: member.id,
          displayName: 'Loading...',
          imageUrl: null,
          color: 'gray',
        };
        return acc;
      },
      {},
    );
    this.fetchMembers();
  };

  @action private onMembersChange = (msg: ServerGameMembersChangeMessage) => {
    this.members = msg.members;
    this.players = msg.members.reduce<Record<PrefixedId<'u'>, PlayerInfo>>(
      (acc, member) => {
        acc[member.id] = this.players[member.id] ?? {
          id: member.id,
          displayName: 'Loading...',
          imageUrl: null,
          color: 'gray',
        };
        return acc;
      },
      {},
    );
    this.fetchMembers();
  };

  debug = async () => {
    // try loading global state (works in dev mode)
    try {
      await this.loadPostgame();
    } catch (e) {
      console.error(
        'Error loading global postgame state. Are you running with DEV_MODE flag on backend?',
        e,
      );
    }
    const debugValue: any = {
      ...toJS(this),
      // toJS doesn't evaluate computed properties, so we need to
      // do this manually.
      latestRound: toJS(this.latestRound),
      initialState: toJS(this.initialState),
      finalState: toJS(this.finalState),
      currentTurn: toJS(this.currentTurn),
      viewingTurn: toJS(this.viewingTurn),
      globalState: toJS(this.postgameGlobalState),
      turns: await getDevModeTurns(this.gameSessionId),
      viewingRound: toJS(this.viewingRound),
      rounds: toJS(this.rounds),
    };
    // remove functions
    for (const key in debugValue) {
      if (typeof debugValue[key] === 'function') {
        delete debugValue[key];
      }
    }
    // add helpers
    debugValue.getRoundIndex = () =>
      this.gameDefinition.getRoundIndex({
        currentTime: new Date(),
        startedAt: this.startedAt,
        gameTimeZone: this.timezone,
        members: debugValue.members,
        globalState: debugValue.globalState,
        turns: debugValue.turns,
        environment: 'development',
      });
    debugValue.resetGame = () => {
      this.ctx.socket.send({
        type: 'resetGame',
      });
    };

    (window as any).gameSuiteRaw = debugValue;

    return debugValue;
  };
}
