import {
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  LongGameError,
  PlayerColorName,
  PrefixedId,
  ServerChatMessage,
  ServerPlayerStatusChangeMessage,
  ServerRoundChangeMessage,
} from '@long-game/common';
import {
  GameDefinition,
  GetPlayerState,
  GetTurnData,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { action, computed, makeObservable, observable } from 'mobx';
import { getSummary } from './api.js';
import { connectToSocket, GameSocket } from './socket.js';

export type PlayerInfo = {
  id: PrefixedId<'u'>;
  displayName: string;
  imageUrl: string | null;
  color: PlayerColorName;
};

export class GameSessionSuite<TGame extends GameDefinition> {
  confirmedPlayerState: GetPlayerState<TGame>;
  remoteCurrentTurn: {
    data: GetTurnData<TGame> | null;
    roundIndex: number;
    playerId: PrefixedId<'u'>;
  };
  localTurnData: GetTurnData<TGame> | null;
  playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
  players: Record<PrefixedId<'u'>, PlayerInfo>;
  chat: GameSessionChatMessage[] = [];

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

    makeObservable(this, {
      confirmedPlayerState: observable,
      remoteCurrentTurn: observable,
      localTurnData: observable,
      playerStatuses: observable,
      players: observable,
      chat: observable,

      turnError: computed,
      userId: computed,
      playerState: computed,
      turnWasSubmitted: computed,
      currentTurn: computed,
      roundIndex: computed,
      combinedLog: computed,

      prepareTurn: action,
      submitTurn: action,
      sendChat: action,
    });
    // private fields require manual typing
    makeObservable<
      GameSessionSuite<TGame>,
      'addChat' | 'onPlayerStatusChange' | 'removeChat'
    >(this, {
      addChat: action,
      onPlayerStatusChange: action,
      removeChat: action,
    });

    this.connectSocket(ctx.socket);
  }

  get playerState(): GetPlayerState<TGame> {
    const baseState = this.confirmedPlayerState;
    const userId = this.userId;
    const localTurnData = this.localTurnData;

    if (!localTurnData) return baseState;

    return this.gameDefinition.getProspectivePlayerState({
      playerState: baseState,
      prospectiveTurn: localTurnData,
      playerId: userId,
    });
  }

  get currentTurn() {
    const localTurn = this.localTurnData;
    const remoteTurn = this.remoteCurrentTurn.data;

    if (localTurn) return localTurn;
    if (remoteTurn) return remoteTurn;
    return null;
  }

  get roundIndex() {
    return this.remoteCurrentTurn.roundIndex;
  }

  get turnWasSubmitted() {
    return !!this.remoteCurrentTurn.data;
  }

  get turnError() {
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

  get userId() {
    return this.remoteCurrentTurn.playerId;
  }

  get combinedLog() {
    const chat = this.chat;
    // todo: round history
    // const rounds = this.rounds;
    return chat.map((msg) => ({
      type: 'chat' as const,
      chatMessage: msg,
      timestamp: msg.createdAt,
    }));
  }

  prepareTurn = (turn: GetTurnData<TGame>) => {
    this.localTurnData = turn;
  };

  submitTurn = async (override?: GetTurnData<TGame>) => {
    if (override) {
      this.prepareTurn(override);
    }
    const error = this.turnError;
    if (error) {
      return error;
    }
    await this.ctx.socket.request({
      type: 'submitTurn',
      turn: this.localTurnData,
    });
  };

  sendChat = async (message: {
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

  loadMoreChat = async () => {
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
  };

  private onChat = (msg: ServerChatMessage) => {
    msg.messages.forEach(this.addChat);
    if (msg.nextToken !== undefined) {
      this.#chatNextToken = msg.nextToken;
    }
  };

  private addChat = (msg: GameSessionChatMessage) => {
    this.chat.push(msg);
    this.chat.sort((a, b) => a.createdAt - b.createdAt);
    this.chat = this.chat.filter((msg, i, arr) => {
      if (i === 0) {
        return true;
      }
      return msg.id !== arr[i - 1].id;
    });
  };

  private removeChat = (id: string) => {
    this.chat = this.chat.filter((msg) => msg.id !== id);
  };

  private onPlayerStatusChange = (msg: ServerPlayerStatusChangeMessage) => {
    this.playerStatuses[msg.playerId] = msg.playerStatus;
  };

  private onRoundChange = (msg: ServerRoundChangeMessage) => {
    if (msg.currentRoundIndex !== this.remoteCurrentTurn.roundIndex) {
      this.remoteCurrentTurn = {
        data: null,
        roundIndex: msg.currentRoundIndex,
        playerId: this.remoteCurrentTurn.playerId,
      };
      this.confirmedPlayerState = msg.playerState as any;
    }
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
