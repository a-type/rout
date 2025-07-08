import { EventSubscriber } from '@a-type/utils';
import {
  GameRoundSummary,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  isPrefixedId,
  LongGameError,
  PlayerColorName,
  PrefixedId,
  ServerChatMessage,
  ServerGameMembersChangeMessage,
  ServerNextRoundScheduledMessage,
  ServerPlayerStatusChangeMessage,
  ServerRoundChangeMessage,
  ServerStatusChangeMessage,
  ServerTurnPlayedMessage,
} from '@long-game/common';
import {
  BaseTurnError,
  GameDefinition,
  GameMember,
  GetGlobalState,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
  GetTurnDataOrInitial,
  GetTurnError,
  simpleError,
  TurnUpdater,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { action, autorun, computed, observable, runInAction, toJS } from 'mobx';
import { GameLogItem } from '../types.js';
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
  color: PlayerColorName;
};

type GameSessionSuiteEvents = {
  turnPlayed: () => void;
  turnPrepared: () => void;
  turnValidationFailed: (error: BaseTurnError) => void;
  turnSubmitDelayed: (delayTime: number) => void;
  turnSubmitCancelled: () => void;
  error: (error: LongGameError) => void;
  roundChanged: () => void;
  membersChanged: () => void;
};

export class GameSessionSuite<
  TGame extends GameDefinition<any, any, any, any, any, any>,
> {
  #instanceId = Math.random().toString(36).slice(2);
  @observable accessor localTurnData!: GetTurnData<TGame> | null | undefined;
  @observable accessor playerStatuses!: Record<
    PrefixedId<'u'>,
    GameSessionPlayerStatus
  >;
  @observable accessor players!: Record<PrefixedId<'u'>, PlayerInfo>;
  @observable accessor chat: GameSessionChatMessage[] = [];
  @observable accessor gameStatus!: GameStatus;
  /**
   * Accessing rounds directly is not advisable, as they
   * may be undefined if not loaded from the server, and this
   * will not load them for you. Use getRound instead.
   * @see getRound
   * @see viewingRound
   * @see latestRound
   */
  @observable accessor rounds: GameRoundSummary<
    GetTurnData<TGame>,
    GetPublicTurnData<TGame>,
    GetPlayerState<TGame>
  >[] = [];
  @observable accessor viewingRoundIndex = 0;
  @observable accessor postgameGlobalState: GetGlobalState<TGame> | null = null;
  @observable accessor gameId!: string;
  @observable accessor gameVersion!: string;
  @observable accessor nextRoundCheckAt: Date | null = null;
  @observable accessor turnSubmitTimeout: ReturnType<typeof setTimeout> | null =
    null;

  // static
  gameSessionId: PrefixedId<'gs'>;
  members!: GameMember[];
  playerId: PrefixedId<'u'>;
  startedAt: Date | null = null;
  timezone!: string;
  #events = new EventSubscriber<GameSessionSuiteEvents>();

  // non-reactive
  #chatNextToken: string | null = null;

  #disposes: (() => void)[] = [];

  constructor(
    init: {
      currentRoundIndex: number;
      playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
      gameId: string;
      gameVersion: string;
      id: PrefixedId<'gs'>;
      members: GameMember[];
      status: GameStatus;
      playerId: PrefixedId<'u'>;
      startedAt: string | null;
      timezone: string;
    },
    private ctx: {
      socket: GameSocket;
    },
  ) {
    this.playerId = init.playerId;
    this.gameSessionId = init.id;

    this.applyGameData(init);

    this.subscribeSocket();
    this.#subscribeWindowEvents();
    this.setupLocalTurnStorage();

    if (init.status.status === 'complete') {
      this.loadPostgame();
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

  dispose = () => {
    this.#disposes.forEach((dispose) => dispose());
  };

  /**
   * Subscribe to events from the game session. Normally
   * you can use withGame and reference properties directly,
   * which will automatically re-render your component. But
   * you can use this as needed too.
   */
  get subscribe() {
    return this.#events.subscribe;
  }

  @computed get gameDefinition() {
    const { gameId, gameVersion } = this;
    const def = games[gameId].versions.find(
      (v) => v.version === gameVersion,
    ) as TGame;
    if (!def) {
      this.#events.emit(
        'error',
        new LongGameError(
          LongGameError.Code.Unknown,
          'Game definition not found',
        ),
      );
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Game definition not found',
      );
    }
    return def;
  }

  /**
   * Which round is currently being viewed, according
   * to the user's position in history. The user can
   * use the UI to navigate forward and backward in
   * round history, so this is not necessarily the
   * latest round.
   * @see latestRound
   */
  @computed get viewingRound() {
    if (!this.rounds[this.viewingRoundIndex]) {
      this.loadRound(this.viewingRoundIndex);
    }
    return this.rounds[this.viewingRoundIndex];
  }

  /**
   * The most recent round index of the game (i.e. the one
   * being played, if the game is active). Remember
   * round indexes are 0-based.
   */
  @computed get latestRoundIndex() {
    return this.rounds.length - 1;
  }

  /**
   * A summary of the most recent (i.e. current) round.
   * The turn data of this round may be incomplete:
   * players may not have submitted their turns yet.
   * Additionally, even public turn data from other players is not
   * accessible (null) since the round is in progress.
   */
  @computed get latestRound() {
    if (!this.rounds[this.latestRoundIndex]) {
      this.loadRound(this.latestRoundIndex);
    }
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
    const viewingRound = this.getRound(viewingRoundIndex);

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

    const nextRound = this.getRound(viewingRoundIndex + 1);

    // since historical rounds need to be loaded, we may not have the next
    // round available, theoretically. Implementation should prevent this
    // from actually being rendered, but either way, we should handle it.
    // Presently, we just return the initial state.
    if (!nextRound) {
      return this.initialState;
    }
    return nextRound.initialPlayerState;
  }

  @computed get currentTurn(): GetTurnDataOrInitial<TGame> {
    const { localTurnData: localTurn, latestRound } = this;
    const remoteTurn = latestRound.yourTurnData;

    if (localTurn) return localTurn;
    if (localTurn === null) {
      // if localTurnData is null, it means the user has explicitly cleared
      // their turn data, so we should not return the remote turn.
      return this.gameDefinition.getInitialTurn?.() ?? (null as any);
    }
    if (remoteTurn) return remoteTurn;
    return this.gameDefinition.getInitialTurn?.() ?? (null as any);
  }

  @computed get hasLocalTurn(): boolean {
    return !!this.localTurnData;
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

  @computed get isTurnSubmitDelayed() {
    return !!this.turnSubmitTimeout;
  }

  /**
   * Even if the player submitted a turn for this round,
   * this will tell you if they've made changes since and
   * need to resubmit to the server.
   */
  @computed get canSubmitTurn() {
    return !!this.localTurnData && !this.turnError;
  }

  @computed get turnError(): GetTurnError<TGame> | null {
    if (this.localTurnData === undefined) return null;
    if (this.localTurnData === null) {
      // user has manually reset turn. if no turn was submitted,
      // we're still in an 'initial' state and no error is needed.
      if (!this.turnWasSubmitted) {
        return null;
      }
      // otherwise we should validate the reset turn.
      const toValidate = this.gameDefinition.getInitialTurn?.() ?? null;
      const err = this.validateTurn(toValidate);
      if (typeof err === 'string') {
        return simpleError(err) as GetTurnError<TGame>;
      }
      return err;
    }
    const err = this.validateTurn(this.localTurnData) || null;
    if (typeof err === 'string') {
      return simpleError(err) as GetTurnError<TGame>;
    }
    return err as GetTurnError<TGame>;
  }

  private getPreviousTurnForUpdater = (): GetTurnDataOrInitial<TGame> => {
    if (!this.gameDefinition.getInitialTurn) {
      return this.localTurnData ? toJS(this.localTurnData) : (null as any);
    }
    return (
      toJS(this.localTurnData) || (this.gameDefinition.getInitialTurn() as any)
    );
  };
  validatePartialTurn = (turnData: TurnUpdater<TGame>) => {
    if (!this.gameDefinition.validatePartialTurn)
      return this.validateTurn(turnData);

    const baseState = toJS(this.latestRound.initialPlayerState);
    const roundIndex = this.latestRound.roundIndex;
    const dataToValidate =
      typeof turnData === 'function'
        ? (turnData as any)(this.getPreviousTurnForUpdater())
        : turnData;
    const err = this.gameDefinition.validatePartialTurn({
      members: this.members,
      playerState: baseState,
      roundIndex,
      turn: {
        playerId: this.playerId,
        data: dataToValidate,
      },
    });

    if (err) {
      if (typeof err === 'string') {
        return simpleError(err) as GetTurnError<TGame>;
      }
      return err as GetTurnError<TGame>;
    }
    return null;
  };
  /**
   * Validate a potential turn without applying it to the client.
   * You can derive your new turn from the existing data with a function parameter.
   */
  validateTurn = (turnData: TurnUpdater<TGame>): GetTurnError<TGame> | null => {
    const baseState = toJS(this.latestRound.initialPlayerState);
    const roundIndex = this.latestRound.roundIndex;
    const dataToValidate =
      typeof turnData === 'function'
        ? (turnData as any)(this.getPreviousTurnForUpdater())
        : turnData;
    const params = {
      members: this.members,
      playerState: baseState,
      roundIndex,
      turn: {
        playerId: this.playerId,
        data: dataToValidate,
      },
    };
    const err =
      this.gameDefinition.validatePartialTurn?.(params) ||
      this.gameDefinition.validateTurn(params);

    if (err) {
      if (typeof err === 'string') {
        return simpleError(err) as GetTurnError<TGame>;
      }
      return err as GetTurnError<TGame>;
    }
    return null;
  };

  @computed get combinedLog() {
    const chat = this.chat;

    // chat is grouped by round first, then ordered by timestamp.
    // this may seem a little unintuitive, but the assigned round
    // of a chat may be a future round compared to when the chat
    // was created, and the chat will not be shown until that round
    // is reached, so round index is the primary ordering.

    // although the client may be viewing a different round, we
    // always return all logs. The UI can decide how to display
    // "future" logs when the user is viewing history.
    const currentRoundIndex = this.latestRoundIndex;

    // additionally, this grouping allows us to insert rounds into the log
    // in the right spot, since we don't have timestamps for them by nature.
    const chatsGroupedByRound = chat.reduce((acc, msg) => {
      const roundIndex = msg.roundIndex;
      if (!acc.has(roundIndex)) {
        acc.set(roundIndex, []);
      }
      // we rely on chat already being sorted by timestamp
      acc.get(roundIndex)!.push(msg);
      return acc;
    }, new Map<number, GameSessionChatMessage[]>());

    const log = new Array<GameLogItem<TGame>>();

    for (let roundIndex = 0; roundIndex <= currentRoundIndex; roundIndex++) {
      const chatForRound = chatsGroupedByRound.get(roundIndex);
      if (chatForRound) {
        log.push(
          ...chatForRound
            .map((msg) => ({
              type: 'chat' as const,
              chatMessage: msg,
              timestamp: msg.createdAt,
            }))
            .sort((a, b) =>
              new Date(a.timestamp) > new Date(b.timestamp) ? 1 : -1,
            ),
        );
      }
      if (roundIndex < currentRoundIndex) {
        log.push({
          type: 'round' as const,
          roundIndex,
        });
      }
    }

    // only add postgame if the game is completed
    if (this.gameStatus.status === 'complete') {
      log.push(
        ...(
          chatsGroupedByRound.get(-1)?.map((msg) => ({
            type: 'chat' as const,
            chatMessage: msg,
            timestamp: msg.createdAt,
          })) ?? []
        ).sort((a, b) =>
          new Date(a.timestamp) > new Date(b.timestamp) ? 1 : -1,
        ),
      );
    }

    return log;
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

  /**
   * Get a summary of a specific round. If the round has not
   * been loaded from the server, this will suspend your
   * component.
   */
  getRound = (roundIndex: number) => {
    if (!this.rounds[roundIndex]) {
      // this will throw a promise if the round is not loaded
      this.loadRound(roundIndex);
    }
    return this.rounds[roundIndex];
  };

  /**
   * Loads specific rounds by indexes and returns them.
   */
  getRounds = (indexes: number[]) => {
    const missingRounds = indexes.filter((i) => !this.rounds[i]);
    if (missingRounds.length > 0) {
      // throw a meta-promise to load all rounds
      throw Promise.allSettled(
        missingRounds.map(this.#getOrCreateRoundLoadingPromise),
      );
    }
    return indexes.map((i) => this.rounds[i]!);
  };

  /**
   * Loads a range of rounds from game history and returns them.
   */
  getRoundRange = (from: number, to: number) => {
    if (from < 0 || to < 0 || from > to) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Invalid round range: ${from} to ${to}`,
      );
    }
    const rounds = this.getRounds(
      Array.from({ length: to - from + 1 }, (_, i) => i + from),
    );
    return rounds;
  };

  /**
   * Loads and returns the full game history. WARNING! This can be a
   * lot of data and network requests! Please don't use it?
   */
  getAllRounds = () => {
    return this.getRoundRange(0, this.latestRoundIndex);
  };

  @action prepareTurn = (turn: TurnUpdater<TGame> | null) => {
    if (typeof turn === 'function') {
      this.localTurnData = (turn as any)(this.getPreviousTurnForUpdater());
    } else {
      this.localTurnData = turn;
    }
    // if a turn submit was delayed, cancel it
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
      this.turnSubmitTimeout = null;
    }
    this.#events.emit('turnPrepared');
  };

  @action submitTurn = async ({
    data: override,
    delay,
  }: {
    data?: GetTurnData<TGame> | null;
    delay?: number;
  } = {}): Promise<BaseTurnError | void> => {
    if (override) {
      this.prepareTurn(override);
    }
    const localTurnData = this.localTurnData;
    if (!localTurnData) {
      return simpleError('Play a turn first!');
    }
    const error = this.turnError;
    if (error) {
      this.#events.emit('turnValidationFailed', error);
      return error;
    }
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
    }
    if (delay) {
      this.#events.emit('turnSubmitDelayed', delay);
      return new Promise<BaseTurnError | void>((resolve) => {
        // if the user closes the window before the timeout, force the submit.
        const beforeUnload = async () => {
          if (this.turnSubmitTimeout) {
            clearTimeout(this.turnSubmitTimeout);
            this.turnSubmitTimeout = null;
            await this.#actuallySubmitTurn(localTurnData);
            resolve();
          }
        };
        window.addEventListener('beforeunload', beforeUnload, {
          once: true,
        });
        const visibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            beforeUnload();
          }
        };
        document.addEventListener('visibilitychange', visibilityChange, {
          once: true,
        });

        runInAction(() => {
          this.turnSubmitTimeout = setTimeout(async () => {
            window.removeEventListener('beforeunload', beforeUnload);
            document.removeEventListener('visibilitychange', visibilityChange);
            await this.#actuallySubmitTurn(localTurnData);
            resolve();
          }, delay);
        });
      });
    } else {
      return this.#actuallySubmitTurn(localTurnData);
    }
  };

  @action #actuallySubmitTurn = async (
    data: GetTurnData<TGame>,
  ): Promise<BaseTurnError | void> => {
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
      this.turnSubmitTimeout = null;
    }

    const submittingToRound = this.latestRoundIndex;
    try {
      const response = await this.ctx.socket.request({
        type: 'submitTurn',
        turnData: data,
      });
      if (response.type === 'error') {
        this.#events.emit(
          'error',
          new LongGameError(LongGameError.Code.Unknown, response.message),
        );
        return simpleError(response.message);
      } else {
        // locally update the submitted round with our turn and
        // reset local turn data
        runInAction(() => {
          this.rounds[submittingToRound].yourTurnData = data;
          this.localTurnData = undefined;
        });
        this.#events.emit('turnPlayed');
      }
    } catch (e) {
      const msg = LongGameError.wrap(e as any).message;
      this.#events.emit(
        'error',
        new LongGameError(LongGameError.Code.Unknown, msg),
      );
      return simpleError('Error submitting turn. Try again?');
    }
  };

  @action cancelSubmit = () => {
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
      this.turnSubmitTimeout = null;
      this.#events.emit('turnSubmitCancelled');
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

    const messageWithRound = {
      ...message,
      roundIndex:
        message.roundIndex === undefined
          ? this.latestRoundIndex
          : message.roundIndex,
    };

    // this.addChat({
    //   id: tempId,
    //   createdAt: new Date().toISOString(),
    //   authorId: this.playerId,
    //   ...messageWithRound,
    // });
    await this.ctx.socket.request({
      type: 'sendChat',
      message: messageWithRound,
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

  @action toggleChatReaction = async (
    messageId: PrefixedId<'cm'>,
    reaction: string,
  ) => {
    const chatMessage = this.chat.find((msg) => msg.id === messageId);
    if (!chatMessage) {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        `Chat message ${messageId} not found`,
      );
    }
    const isOn = chatMessage.reactions[reaction]?.includes(this.playerId);
    await this.ctx.socket.request({
      type: 'toggleChatReaction',
      chatMessageId: messageId,
      isOn: !isOn,
      reaction,
    });
  };

  private cachedLoadRoundPromises: Record<number, Promise<void>> = {};

  /**
   * Suspends the caller component until round is loaded
   */
  @action loadRound = (roundIndex: number) => {
    throw this.preloadRound(roundIndex);
  };

  /**
   * Loads a round, but does not suspend the caller component.
   */
  preloadRound = (roundIndex: number) => {
    if (this.gameStatus.status === 'pending') {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Cannot load rounds while the game is pending. Wait for the game to start.',
      );
    }

    if (roundIndex < 0 || roundIndex > this.latestRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Cannot get data for round ${roundIndex}. Current round is ${this.latestRoundIndex}`,
      );
    }

    if (this.rounds[roundIndex]) {
      return;
    }
    return this.#getOrCreateRoundLoadingPromise(roundIndex);
  };

  #getOrCreateRoundLoadingPromise = (roundIndex: number) => {
    if (!!this.cachedLoadRoundPromises[roundIndex]) {
      return this.cachedLoadRoundPromises[roundIndex];
    }
    const promise = getPublicRound<TGame>(this.gameSessionId, roundIndex)
      .then(
        action((res) => {
          this.rounds[roundIndex] = res;
        }),
      )
      .catch((err) => {
        console.error('Error loading round', roundIndex, err);
        this.#events.emit(
          'error',
          new LongGameError(LongGameError.Code.Unknown, err.message),
        );
        throw new LongGameError(LongGameError.Code.Unknown, err.message);
      })
      .finally(() => {
        console.log('loaded round', roundIndex);
      });
    this.cachedLoadRoundPromises[roundIndex] = promise;
    return promise;
  };

  @action showRound = (roundIndex: number) => {
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
    this.ctx.socket.subscribe('nextRoundScheduled', this.onNextRoundScheduled);
  };

  private onChat = (msg: ServerChatMessage) => {
    msg.messages.forEach(this.addChat);
    if (msg.nextToken !== undefined) {
      this.#chatNextToken = msg.nextToken;
    }
  };

  @action private addChat = (msg: GameSessionChatMessage) => {
    this.chat = this.chat.filter((c) => c.id !== msg.id);
    this.chat.push(msg);
    this.chat.sort((a, b) =>
      new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1,
    );
  };

  @action private removeChat = (id: string) => {
    this.chat = this.chat.filter((msg) => msg.id !== id);
  };

  @action private onPlayerStatusChange = (
    msg: ServerPlayerStatusChangeMessage,
  ) => {
    this.playerStatuses[msg.playerId] = {
      ...this.playerStatuses[msg.playerId],
      ...msg.playerStatus,
    };
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

    // update player statuses
    for (const [id, status] of Object.entries(msg.playerStatuses)) {
      if (status && isPrefixedId(id, 'u')) {
        this.playerStatuses[id] = status;
      }
    }

    this.#events.emit('roundChanged');
  };

  @action private onStatusChange = (msg: ServerStatusChangeMessage) => {
    this.gameStatus = msg.status;
    // prefetch postgame when status is completed
    if (msg.status.status === 'complete') {
      this.loadPostgame();
    }
  };

  @action private onTurnPlayed = (msg: ServerTurnPlayedMessage) => {
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

  @action private onNextRoundScheduled = (
    msg: ServerNextRoundScheduledMessage,
  ) => {
    this.nextRoundCheckAt = new Date(msg.nextRoundCheckAt);
  };

  @action loadPostgame = async () => {
    const postgame = await getPostgame(this.gameSessionId);
    this.postgameGlobalState = postgame.globalState;
  };

  private fetchMembers = async () => {
    const members = await getPlayers(this.gameSessionId);
    members.forEach(
      action((member: any) => {
        if (!this.players[member.id]) {
          this.players[member.id] = member;
        } else {
          // selectively override from API - we want to keep player colors intact,
          // particularly. but we can show the latest display name.
          this.players[member.id].displayName ||= member.displayName;
        }
      }),
    );
  };

  @action private setupLocalTurnStorage = () => {
    const key = `game-session-${this.gameSessionId}-local-turn-${this.playerId}`;
    const localTurn = localStorage.getItem(key);
    if (localTurn && localTurn !== 'undefined') {
      this.localTurnData = JSON.parse(localTurn);
    }
    autorun(() => {
      if (this.localTurnData === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(this.localTurnData));
      }
    });
  };

  @action private onGameChange = async () => {
    const newData = await getSummary(this.gameSessionId);
    this.applyGameData(newData);
  };

  @action private applyGameData = (init: {
    playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
    gameId: string;
    gameVersion: string;
    status: GameStatus;
    members: GameMember[];
    startedAt: string | null;
    timezone: string;
    nextRoundCheckAt?: string | null;
    currentRoundIndex: number;
  }) => {
    this.viewingRoundIndex = init.currentRoundIndex;
    this.localTurnData = undefined;
    this.rounds = new Array(init.currentRoundIndex + 1).fill(null);
    this.playerStatuses = init.playerStatuses;
    this.gameId = init.gameId;
    this.gameVersion = init.gameVersion;
    this.members = init.members;
    this.gameStatus = init.status;
    this.startedAt = init.startedAt ? new Date(init.startedAt) : null;
    this.timezone = init.timezone;
    this.players = init.members.reduce<Record<PrefixedId<'u'>, PlayerInfo>>(
      (acc, member) => {
        acc[member.id] = {
          id: member.id,
          displayName: member.displayName,
          color: member.color,
        };
        return acc;
      },
      {},
    );
    this.nextRoundCheckAt = init.nextRoundCheckAt
      ? new Date(init.nextRoundCheckAt)
      : null;
    this.fetchMembers();
  };

  @action private onMembersChange = (msg: ServerGameMembersChangeMessage) => {
    this.members = msg.members;
    this.players = msg.members.reduce<Record<PrefixedId<'u'>, PlayerInfo>>(
      (acc, member) => {
        acc[member.id] = this.players[member.id] ?? {
          id: member.id,
          displayName: member.displayName,
          imageUrl: null,
          color: member.color,
        };
        return acc;
      },
      {},
    );
    this.fetchMembers().then(() => {
      this.#events.emit('membersChanged');
    });
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
        startedAt: new Date(this.startedAt!),
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

  /**
   * Only works in dev mode
   */
  resetGame = () => {
    this.ctx.socket.send({
      type: 'resetGame',
    });
  };

  #subscribeWindowEvents = () => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.onGameChange();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.#disposes.push(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  };
}
