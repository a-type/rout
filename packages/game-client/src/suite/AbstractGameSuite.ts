/**
 * The foundational game suite class with common behaviors and the full API interface.
 * This is implemented by the backend-backed GameSuite class, and the local-backed
 * HotseatGameSuite class.
 */

import { EventSubscriber } from '@a-type/utils';
import {
  GameRoundSummary,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  isPrefixedId,
  LongGameError,
  PrefixedId,
  ServerChatMessage,
  ServerGameMembersChangeMessage,
  ServerGameStartingMessage,
  ServerNextRoundScheduledMessage,
  ServerPlayerReadyMessage,
  ServerPlayerStatusChangeMessage,
  ServerPlayerUnreadyMessage,
  ServerPlayerVoteForGameMessage,
  ServerRoundChangeMessage,
  ServerStatusChangeMessage,
  ServerTurnPlayedMessage,
} from '@long-game/common';
import {
  BaseTurnError,
  emptyGameDefinition,
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
import { action, autorun, computed, observable, runInAction, toJS } from 'mobx';
import { GameModuleContext } from '../federation/gameModuleContext.js';
import { GameLogItem } from '../types.js';
import { getDevModeTurns } from './api.js';
import { PlayerInfo } from './GameSessionSuite.js';

const ROOT_CHAT_SCENE_ID = 'null' as const;

export type GameSuiteEvents = {
  turnPlayed: () => void;
  turnPrepared: () => void;
  turnValidationFailed: (error: BaseTurnError) => void;
  turnSubmitDelayed: (delayTime: number) => void;
  turnSubmitCancelled: () => void;
  error: (error: LongGameError) => void;
  roundChanged: () => void;
  membersChanged: () => void;
  gameStarting: (startsAt: string) => void;
  gameStartingCancelled: () => void;
  // only hotseat
  playerChanged: (playerId: PrefixedId<'u'>) => void;
};

export interface GameSuiteBaseInit {
  currentRoundIndex: number;
  playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
  gameId: string;
  gameVersion: string;
  id: PrefixedId<'gs'>;
  playerId: PrefixedId<'u'>;
  members: GameMember[];
  status: GameStatus;
  startedAt: string | null;
  timezone: string;
  gameVotes: Record<string, PrefixedId<'u'>[]>;
  readyPlayers: PrefixedId<'u'>[];
  nextRoundCheckAt?: Date | string | number | null;
}

export abstract class AbstractGameSuite<
  TGame extends GameDefinition<any, any, any, any, any, any>,
> {
  protected instanceId = Math.random().toString(36).slice(2);

  @observable accessor localTurnData!: GetTurnData<TGame> | null | undefined;
  @observable accessor playerStatuses!: Record<
    PrefixedId<'u'>,
    GameSessionPlayerStatus
  >;
  @observable accessor players: Record<PrefixedId<'u'>, PlayerInfo> = {};
  @observable protected accessor sceneChats: Record<
    string,
    {
      nextToken: string | null;
      messages: GameSessionChatMessage[];
      empty: boolean;
    }
  > = {
    [ROOT_CHAT_SCENE_ID]: { messages: [], nextToken: null, empty: false },
  };
  @observable accessor gameStatus!: GameStatus;
  // rounds are keyed by player ID -- this is strange if you're thinking
  // about remote games, but it's important for hotseat where all players
  // are on the same device.
  @observable protected accessor rounds: Record<
    PrefixedId<'u'>,
    GameRoundSummary<
      GetTurnData<TGame>,
      GetPublicTurnData<TGame>,
      GetPlayerState<TGame>
    >[]
  > = {};
  @observable accessor viewingRoundIndex = 0;
  @observable accessor latestRoundIndex = 0;
  @observable accessor postgameGlobalState: GetGlobalState<TGame> | null = null;
  @observable accessor gameId!: string;
  @observable accessor gameVersion!: string;
  @observable accessor nextRoundCheckAt: Date | null = null;
  @observable accessor turnSubmitTimeout: ReturnType<typeof setTimeout> | null =
    null;
  @observable accessor playerId!: PrefixedId<'u'>;
  @observable accessor members: GameMember[] = [];

  // pregame stuff
  @observable accessor gameVotes: Record<string, PrefixedId<'u'>[]> = {};
  @observable accessor readyPlayers: PrefixedId<'u'>[] = [];

  // hotseat only
  @observable accessor pickingPlayer = true;

  // static
  gameModules: GameModuleContext;
  gameSessionId!: PrefixedId<'gs'>;
  gameDefinition: TGame = emptyGameDefinition as any;
  startedAt: Date | null = null;
  timezone!: string;
  protected events = new EventSubscriber<GameSuiteEvents>();

  // non-reactive
  protected disposes: (() => void)[] = [];

  constructor(
    init: GameSuiteBaseInit,
    { gameModules }: { gameModules: GameModuleContext },
  ) {
    // NOTE: how current player ID is assigned is up to the subclass
    this.gameSessionId = init.id;
    this.gameModules = gameModules;

    this.setupLocalTurnStorage();
    this.applyGameData(init);

    if (init.status.status === 'complete') {
      setTimeout(() => this.loadPostgame(), 0);
    }
  }

  abstract connect(): () => void;
  abstract disconnect(): void;

  dispose = () => this.disposes.forEach((dispose) => dispose());
  get subscribe() {
    return this.events.subscribe.bind(this.events);
  }

  // implement this method to actually load round data from your data source
  protected abstract loadRound(
    roundIndex: number,
  ): Promise<
    GameRoundSummary<
      GetTurnData<TGame>,
      GetPublicTurnData<TGame>,
      GetPlayerState<TGame>
    >
  >;

  /**
   * Internal usage. If the round summary for the current playerId
   * is available, returns it. Does not load it otherwise.
   */
  protected maybeGetRound = (roundIndex: number) => {
    return this.rounds[this.playerId]?.[roundIndex];
  };
  /**
   * Assigns the given round summary to the current playerId.
   */
  protected setRound = (
    round: GameRoundSummary<
      GetTurnData<TGame>,
      GetPublicTurnData<TGame>,
      GetPlayerState<TGame>
    >,
    playerId = this.playerId,
  ) => {
    if (!this.rounds[playerId]) {
      this.rounds[playerId] = [];
    }
    this.rounds[playerId][round.roundIndex] = round;
  };

  // caching and suspense mechanisms which wrap loadRound
  private cachedLoadRoundPromises: Record<
    `${PrefixedId<'u'>}-${number}`,
    Promise<void>
  > = {};
  loadRoundSuspended = (roundIndex: number) => {
    throw this.loadRoundUnsuspended(roundIndex);
  };
  loadRoundUnsuspended = (roundIndex: number) => {
    if (this.gameStatus.status === 'pending') {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Cannot load rounds while the game is pending. Wait for the game to start.',
      );
    }

    if (this.maybeGetRound(roundIndex)) {
      return;
    }
    return this.#getOrCreateRoundLoadingPromise(roundIndex);
  };
  #getOrCreateRoundLoadingPromise = (roundIndex: number) => {
    const cacheKey: `${PrefixedId<'u'>}-${number}` = `${this.playerId}-${roundIndex}`;
    if (!!this.cachedLoadRoundPromises[cacheKey]) {
      return this.cachedLoadRoundPromises[cacheKey];
    }
    const promise = this.loadRound(roundIndex)
      .then(action(this.setRound))
      .catch((err) => {
        console.error('Error loading round', roundIndex, err);
        this.events.emit(
          'error',
          new LongGameError(LongGameError.Code.Unknown, err.message),
        );
        throw new LongGameError(LongGameError.Code.Unknown, err.message);
      })
      .finally(() => {
        console.log('loaded round', roundIndex);
      });
    this.cachedLoadRoundPromises[cacheKey] = promise;
    return promise;
  };

  /**
   * Get a summary of a specific round. If the round has not
   * been loaded from the server, this will suspend your
   * component.
   */
  getRound = (roundIndex: number) => {
    if (!this.maybeGetRound(roundIndex)) {
      // this will throw a promise if the round is not loaded
      this.loadRoundSuspended(roundIndex);
    }
    return this.maybeGetRound(roundIndex);
  };
  /**
   * Loads specific rounds by indexes and returns them.
   */
  getRounds = (indexes: number[]) => {
    const missingRounds = indexes.filter((i) => !this.maybeGetRound(i));
    if (missingRounds.length > 0) {
      // throw a meta-promise to load all rounds
      throw Promise.allSettled(
        missingRounds.map(this.#getOrCreateRoundLoadingPromise),
      );
    }
    return indexes.map((i) => this.maybeGetRound(i)!);
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

  @action showRound = (roundIndex: number) => {
    this.viewingRoundIndex = roundIndex;
  };

  /**
   * Which round is currently being viewed, according
   * to the user's position in history. The user can
   * use the UI to navigate forward and backward in
   * round history, so this is not necessarily the
   * latest round.
   * @see latestRound
   */
  @computed get viewingRound() {
    return this.getRound(this.viewingRoundIndex);
  }

  /**
   * A summary of the most recent (i.e. current) round.
   * The turn data of this round may be incomplete:
   * players may not have submitted their turns yet.
   * Additionally, even public turn data from other players is not
   * accessible (null) since the round is in progress.
   */
  @computed get latestRound() {
    return this.getRound(this.latestRoundIndex);
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
    if (!dataToValidate) {
      return null;
    }
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
    if (!dataToValidate) {
      return null; // no turn data to validate
    }
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

  @computed get chat() {
    return this.sceneChats.null.messages;
  }

  // this may seem superfluous but in hotseat mode
  // we want to hide dms that aren't yours and there's
  // not any point in doing something more elaborate!
  private filterChats = (msg: GameSessionChatMessage) => {
    return !msg.recipientIds || msg.recipientIds.includes(this.playerId);
  };

  getSceneChat(sceneId: string) {
    return (
      this.sceneChats[sceneId] ?? {
        messages: [],
      }
    ).messages.filter(this.filterChats);
  }

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
            .filter(this.filterChats)
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
          chatsGroupedByRound
            .get(-1)
            ?.filter(this.filterChats)
            ?.map((msg) => ({
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
    this.events.emit('turnPrepared');
  };

  @action submitTurn = async ({
    data: override,
    delay = 5000,
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
      this.events.emit('turnValidationFailed', error);
      return error;
    }
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
      this.turnSubmitTimeout = null;
    }
    if (delay) {
      this.events.emit('turnSubmitDelayed', delay);
      return new Promise<BaseTurnError | void>((resolve) => {
        // if the user closes the window before the timeout, force the submit.
        const beforeUnload = async () => {
          if (this.turnSubmitTimeout) {
            clearTimeout(this.turnSubmitTimeout);
            this.turnSubmitTimeout = null;
            await this.wrappedSubmitTurn(localTurnData);
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
            await this.wrappedSubmitTurn(localTurnData);
            resolve();
          }, delay);
        });
      });
    } else {
      return this.wrappedSubmitTurn(localTurnData);
    }
  };

  // implement this in subclasses to actually submit the turn
  protected abstract actuallySubmitTurn(
    data: GetTurnData<TGame>,
  ): Promise<BaseTurnError | void>;
  @action private wrappedSubmitTurn = async (data: GetTurnData<TGame>) => {
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
      this.turnSubmitTimeout = null;
    }
    const submittingToRound = this.latestRoundIndex;
    try {
      const remoteError = await this.actuallySubmitTurn(toJS(data));
      if (remoteError) {
        console.info(`Turn submission invalid: ${remoteError.message}`);
        return remoteError;
      }
      runInAction(() => {
        if (this.maybeGetRound(submittingToRound)) {
          this.rounds[this.playerId][submittingToRound].yourTurnData = data;
        }
        this.localTurnData = undefined;
      });
      this.events.emit('turnPlayed');
    } catch (e) {
      const msg = LongGameError.wrap(e as any).message;
      this.events.emit(
        'error',
        new LongGameError(LongGameError.Code.Unknown, msg),
      );
      return simpleError('Error submitting turn. Try again?');
    }
  };

  @action cancelSubmitTurn = () => {
    if (this.turnSubmitTimeout) {
      clearTimeout(this.turnSubmitTimeout);
      this.turnSubmitTimeout = null;
      this.events.emit('turnSubmitCancelled');
    }
  };

  @action sendChat = async (message: {
    content: string;
    recipientIds?: PrefixedId<'u'>[];
    position?: { x: number; y: number };
    sceneId?: string;
    roundIndex?: number;
  }) => {
    const messageWithRound: Omit<
      GameSessionChatMessage,
      'id' | 'createdAt' | 'reactions'
    > = {
      ...message,
      roundIndex:
        message.roundIndex === undefined
          ? this.latestRoundIndex
          : message.roundIndex,
      authorId: this.playerId,
    };

    await this.actuallySendChat(messageWithRound);
  };
  protected abstract actuallySendChat(
    message: Omit<GameSessionChatMessage, 'id' | 'createdAt' | 'reactions'>,
  ): Promise<void>;
  loadMoreChat = async (sceneId?: string | null): Promise<void> => {
    const sceneChat = this.sceneChats[sceneId ?? ROOT_CHAT_SCENE_ID];
    if (sceneChat?.empty) {
      return;
    }
    this.actuallyLoadMoreChat(sceneChat?.nextToken, sceneId);
  };
  abstract actuallyLoadMoreChat(
    nextToken: string | null,
    sceneId?: string | null,
  ): Promise<void>;
  abstract toggleChatReaction(
    chatMessage: GameSessionChatMessage,
    reaction: string,
  ): Promise<void>;

  abstract readyUp(): void;
  abstract unreadyUp(): void;
  abstract toggleReady(): void;

  abstract voteForGame(gameId: string): void;
  abstract removeVoteForGame(gameId: string): void;

  @action protected onChat = (msg: ServerChatMessage) => {
    let sceneChat = this.sceneChats[msg.sceneId ?? ROOT_CHAT_SCENE_ID];
    if (!sceneChat) {
      sceneChat = this.sceneChats[msg.sceneId ?? ROOT_CHAT_SCENE_ID] = {
        messages: [],
        nextToken: null,
        empty: false,
      };
    }

    msg.messages.forEach((msg) => {
      sceneChat.messages = sceneChat.messages.filter((c) => c.id !== msg.id);
      sceneChat.messages.push(msg);
      sceneChat.messages.sort((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1,
      );
    });
    if (msg.nextToken !== undefined) {
      sceneChat.nextToken = msg.nextToken;
    }
  };

  @action protected onPlayerStatusChange = (
    msg: ServerPlayerStatusChangeMessage,
  ) => {
    this.playerStatuses[msg.playerId] = {
      ...this.playerStatuses[msg.playerId],
      ...msg.playerStatus,
    };
  };

  @action protected onRoundChange = async (msg: ServerRoundChangeMessage) => {
    await this.loadRoundUnsuspended(msg.newRoundIndex);
    this.latestRoundIndex = msg.newRoundIndex;
    runInAction(() => {
      // reset turn data for new round
      this.localTurnData = undefined;

      // update current state if the round has advanced and we were viewing
      // the current round
      if (this.viewingRoundIndex === msg.newRoundIndex - 1) {
        this.viewingRoundIndex = msg.newRoundIndex;
      }

      // update player statuses
      for (const [id, status] of Object.entries(msg.playerStatuses)) {
        if (status && isPrefixedId(id, 'u')) {
          this.playerStatuses[id] = status;
        }
      }
    });

    this.events.emit('roundChanged');
  };

  @action protected onStatusChange = (msg: ServerStatusChangeMessage) => {
    console.log('incoming status', msg.status);
    this.gameStatus = msg.status;
    // prefetch postgame when status is completed
    if (msg.status.status === 'complete') {
      this.loadPostgame();
    }
  };

  @action protected onTurnPlayed = (msg: ServerTurnPlayedMessage) => {
    // update the round with the new turn data
    const round = this.maybeGetRound(msg.roundIndex);
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

  @action protected onNextRoundScheduled = (
    msg: ServerNextRoundScheduledMessage,
  ) => {
    this.nextRoundCheckAt = new Date(msg.nextRoundCheckAt);
  };

  @action protected onGameChange = async () => {
    const newData = await this.getGameData();
    this.applyGameData(newData);
  };

  @action protected onMembersChange = async (
    msg: ServerGameMembersChangeMessage,
  ) => {
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
    await this.loadMembers();
  };

  @action protected onPlayerReady = (msg: ServerPlayerReadyMessage) => {
    this.readyPlayers.push(msg.playerId);
  };
  @action protected onPlayerUnready = (msg: ServerPlayerUnreadyMessage) => {
    this.readyPlayers = this.readyPlayers.filter((id) => id !== msg.playerId);
    this.events.emit('gameStartingCancelled');
  };

  @action protected onPlayerVoteForGame = (
    msg: ServerPlayerVoteForGameMessage,
  ) => {
    this.gameVotes = msg.votes;
  };

  protected onGameStarting = (msg: ServerGameStartingMessage) => {
    this.events.emit('gameStarting', msg.startsAt);
  };

  protected abstract getPostgame(): Promise<GetGlobalState<TGame> | null>;
  @action protected loadPostgame = async () => {
    const postgame = await this.getPostgame();
    if (postgame) {
      this.postgameGlobalState = postgame;
    }
  };

  @computed get localTurnStorageKey() {
    return `game-session-${this.gameSessionId}-local-turn-${this.playerId}`;
  }
  @action private setupLocalTurnStorage = () => {
    // when the key changes, load new localTurnData
    autorun(() => {
      const localTurn = localStorage.getItem(this.localTurnStorageKey);
      runInAction(() => {
        if (localTurn && localTurn !== 'undefined') {
          this.localTurnData = JSON.parse(localTurn);
        } else {
          this.localTurnData = undefined;
        }
      });
    });
    // when localTurnData changes, save it to localStorage
    autorun(() => {
      if (this.localTurnData === undefined) {
        localStorage.removeItem(this.localTurnStorageKey);
      } else {
        localStorage.setItem(
          this.localTurnStorageKey,
          JSON.stringify(this.localTurnData),
        );
      }
    });
  };

  protected abstract getGameData(): Promise<GameSuiteBaseInit>;

  @action private applyGameData = async (init: GameSuiteBaseInit) => {
    this.gameModules.getGameDefinition(init.gameId, init.gameVersion).then(
      action((gameDefinition) => {
        this.gameDefinition = gameDefinition as TGame;
      }),
    );
    this.viewingRoundIndex = init.currentRoundIndex;
    this.latestRoundIndex = init.currentRoundIndex;
    this.localTurnData = undefined;
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
    if (init.gameVotes) {
      this.gameVotes = init.gameVotes;
    }
    if (init.readyPlayers) {
      this.readyPlayers = init.readyPlayers;
    }
    // wait a tick... since this gets called from the constructor...
    // subclasses haven't defined methods yet :S
    setTimeout(this.loadMembers);
  };

  @action changeGame = async (gameId: string, version: string) => {
    if (this.gameStatus.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot change game when the game is already started.',
      );
    }
    this.gameDefinition = (await this.gameModules.getGameDefinition(
      gameId,
      version,
    )) as TGame;
    this.gameId = gameId;
    this.gameVersion = version;
  };

  protected abstract getMembers(): Promise<GameMember[]>;
  @action protected loadMembers = async () => {
    const members = await this.getMembers();
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
    this.events.emit('membersChanged');
  };

  abstract switchPlayer(playerId: PrefixedId<'u'>): void;

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
      this.resetGame();
    };

    (window as any).gameSuiteRaw = debugValue;

    return debugValue;
  };

  /**
   * Only works in dev mode
   */
  abstract resetGame(): Promise<void>;
}
