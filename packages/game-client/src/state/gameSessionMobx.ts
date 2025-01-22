import {
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
  GetTurnData,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { action, autorun, computed, observable } from 'mobx';
import { getPlayers, getSummary } from './api.js';
import { connectToSocket, GameSocket } from './socket.js';

export type PlayerInfo = {
  id: PrefixedId<'u'>;
  displayName: string;
  imageUrl: string | null;
  color: PlayerColorName;
};

export class GameSessionSuite<TGame extends GameDefinition> {
  @observable accessor confirmedPlayerState: GetPlayerState<TGame>;
  @observable accessor remoteCurrentTurn: {
    data: GetTurnData<TGame> | null;
    roundIndex: number;
    playerId: PrefixedId<'u'>;
  };
  @observable accessor localTurnData: GetTurnData<TGame> | null;
  @observable accessor playerStatuses: Record<
    PrefixedId<'u'>,
    GameSessionPlayerStatus
  >;
  @observable accessor players: Record<PrefixedId<'u'>, PlayerInfo>;
  @observable accessor chat: GameSessionChatMessage[] = [];
  @observable accessor gameStatus: GameStatus;

  // static
  gameId: string;
  gameVersion: string;
  gameSessionId: PrefixedId<'gs'>;
  gameDefinition: TGame;
  members: { id: PrefixedId<'u'> }[];

  // non-reactive
  #chatNextToken: string | null = null;

  constructor(
    init: {
      playerState: GetPlayerState<TGame>;
      currentTurn: Turn<GetTurnData<TGame>>;
      playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
      gameId: string;
      gameVersion: string;
      id: PrefixedId<'gs'>;
      members: { id: PrefixedId<'u'> }[];
      gameDefinition: TGame;
      status: GameStatus;
    },
    private ctx: {
      socket: GameSocket;
    },
  ) {
    this.confirmedPlayerState = init.playerState;
    this.remoteCurrentTurn = init.currentTurn;
    this.localTurnData = null;
    this.playerStatuses = init.playerStatuses;
    this.gameId = init.gameId;
    this.gameVersion = init.gameVersion;
    this.gameSessionId = init.id;
    this.members = init.members;
    this.gameStatus = init.status;
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

  @computed get playerState(): GetPlayerState<TGame> {
    const baseState = this.confirmedPlayerState;
    const userId = this.userId;
    const localTurnData = this.localTurnData;

    if (!localTurnData) return baseState;

    return this.gameDefinition.getProspectivePlayerState({
      playerState: baseState,
      prospectiveTurn: {
        data: localTurnData,
        playerId: userId,
      },
    });
  }

  @computed get currentTurn() {
    const localTurn = this.localTurnData;
    const remoteTurn = this.remoteCurrentTurn.data;

    if (localTurn) return localTurn;
    if (remoteTurn) return remoteTurn;
    return null;
  }

  @computed get roundIndex() {
    return this.remoteCurrentTurn.roundIndex;
  }

  @computed get turnWasSubmitted() {
    return !!this.remoteCurrentTurn.data;
  }

  @computed get turnError() {
    const baseState = this.confirmedPlayerState;
    const roundIndex = this.remoteCurrentTurn.roundIndex;
    const userId = this.userId;
    if (!this.localTurnData) return null;
    return (
      this.gameDefinition.validateTurn({
        members: this.members,
        playerState: baseState,
        roundIndex,
        turn: {
          playerId: userId,
          data: this.localTurnData,
        },
      }) || null
    );
  }

  @computed get userId() {
    return this.remoteCurrentTurn.playerId;
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
    const response = await this.ctx.socket.request({
      type: 'submitTurn',
      turn: localTurnData,
    });
    if (response.type === 'error') {
      return response.message;
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
      authorId: this.userId,
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
    if (msg.currentRoundIndex !== this.remoteCurrentTurn.roundIndex) {
      this.remoteCurrentTurn = {
        data: null,
        roundIndex: msg.currentRoundIndex,
        playerId: this.remoteCurrentTurn.playerId,
      };
      this.confirmedPlayerState = msg.playerState as any;
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

  private setupLocalTurnStorage = () => {
    const userId = this.userId;
    const key = `game-session-${this.gameSessionId}-local-turn-${userId}`;
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
      currentTurn: init.currentTurn as any,
      gameDefinition,
    },
    { socket },
  );
}
