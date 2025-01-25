import {
  GameRoundSummary,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  LongGameError,
  PlayerColorName,
  PrefixedId,
  ServerChatMessage,
  ServerPlayerStatusChangeMessage,
  ServerRoundChangeMessage,
  ServerStatusChangeMessage,
} from '@long-game/common';
import {
  GameDefinition,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { action, autorun, computed, observable } from 'mobx';
import { getPlayers, getPublicRound, getSummary } from './api.js';
import { connectToSocket, GameSocket } from './socket.js';

export type PlayerInfo = {
  id: PrefixedId<'u'>;
  displayName: string;
  imageUrl: string | null;
  color: PlayerColorName;
};

export class GameSessionSuite<TGame extends GameDefinition> {
  @observable accessor localTurnData: GetTurnData<TGame> | null;
  @observable accessor playerStatuses: Record<
    PrefixedId<'u'>,
    GameSessionPlayerStatus
  >;
  @observable accessor players: Record<PrefixedId<'u'>, PlayerInfo>;
  @observable accessor chat: GameSessionChatMessage[] = [];
  @observable accessor gameStatus: GameStatus;
  @observable accessor rounds: GameRoundSummary<
    GetTurnData<TGame>,
    GetPublicTurnData<TGame>,
    GetPlayerState<TGame>
  >[] = [];
  @observable accessor viewingRoundIndex = 0;
  @observable accessor suspended: Promise<void> | null = null;

  // static
  gameId: string;
  gameVersion: string;
  gameSessionId: PrefixedId<'gs'>;
  gameDefinition: TGame;
  members: { id: PrefixedId<'u'> }[];
  playerId: PrefixedId<'u'>;

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
      gameDefinition: TGame;
      status: GameStatus;
      playerId: PrefixedId<'u'>;
    },
    private ctx: {
      socket: GameSocket;
    },
  ) {
    this.viewingRoundIndex = init.currentRound.roundIndex;
    this.localTurnData = null;
    this.rounds = new Array(init.currentRound.roundIndex).fill(null);
    this.rounds[init.currentRound.roundIndex] = init.currentRound;
    this.playerStatuses = init.playerStatuses;
    this.gameId = init.gameId;
    this.gameVersion = init.gameVersion;
    this.gameSessionId = init.id;
    this.members = init.members;
    this.gameStatus = init.status;
    this.playerId = init.playerId;
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
    this.gameDefinition = init.gameDefinition;

    this.connectSocket(ctx.socket);
    this.fetchMembers();
    this.setupLocalTurnStorage();
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
    const { latestRoundIndex, viewingRoundIndex, localTurnData } = this;
    const viewingRound = this.rounds[viewingRoundIndex];
    const nextRound = this.rounds[viewingRoundIndex + 1];

    if (viewingRoundIndex === latestRoundIndex) {
      // for current round, apply prospective turn to initial state
      if (!localTurnData) return viewingRound.initialPlayerState;

      return this.gameDefinition.getProspectivePlayerState({
        playerState: viewingRound.initialPlayerState,
        prospectiveTurn: {
          data: localTurnData,
          playerId: this.playerId,
        },
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

  @action prepareTurn = (turn: GetTurnData<TGame>) => {
    this.localTurnData = turn;
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
      return error;
    }
    const submittingToRound = this.latestRoundIndex;
    const response = await this.ctx.socket.request({
      type: 'submitTurn',
      turnData: localTurnData,
    });
    if (response.type === 'error') {
      return response.message;
    } else {
      // locally update the submitted round with our turn
      this.rounds[submittingToRound].yourTurnData = localTurnData;
    }
  };

  @action sendChat = async (message: {
    content: string;
    recipientIds?: PrefixedId<'u'>[];
    position?: { x: number; y: number };
    sceneId?: string;
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

    const existing = this.rounds[roundIndex];
    if (existing) {
      this.viewingRoundIndex = roundIndex;
      return;
    }

    this.suspended = getPublicRound<TGame>(this.gameSessionId, roundIndex).then(
      action((res) => {
        this.rounds[roundIndex] = res;
        this.viewingRoundIndex = roundIndex;
      }),
    );
  };

  private connectSocket = (socket: GameSocket) => {
    socket.subscribe('chat', this.onChat);
    socket.subscribe('playerStatusChange', this.onPlayerStatusChange);
    socket.subscribe('roundChange', this.onRoundChange);
    socket.subscribe('statusChange', this.onStatusChange);
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
  };

  @action private onStatusChange = (msg: ServerStatusChangeMessage) => {
    this.gameStatus = msg.status;
  };

  private fetchMembers = async () => {
    const members = await getPlayers(this.gameSessionId);
    members.forEach(
      action((member) => {
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
}

export async function createGameSessionSuite<TGame extends GameDefinition>(
  gameSessionId: PrefixedId<'gs'>,
): Promise<GameSessionSuite<TGame>> {
  const init = await getSummary(gameSessionId);
  const socket = await connectToSocket(gameSessionId);

  const gameModule = games[init.gameId];
  const gameDefinition = gameModule.versions.find(
    (v) => v.version === init.gameVersion,
  ) as TGame;
  if (!gameDefinition) {
    throw new LongGameError(
      LongGameError.Code.Unknown,
      'Game definition not found',
    );
  }

  return new GameSessionSuite(
    {
      ...init,
      // some of the typings break - basically ones which have generics/any in them
      playerState: init.playerState as any,
      currentRound: init.currentRound as any,
      playerId: init.playerId,
      gameDefinition,
    },
    { socket },
  );
}
