import {
  GameSessionChatInit,
  GameSessionChatMessage,
  LongGameError,
  PlayerColorName,
  PrefixedId,
} from '@long-game/common';
import {
  AnyGameDefinition,
  BaseTurnError,
  GetTurnData,
} from '@long-game/game-definition';
import { runInAction } from 'mobx';
import { PublicSdk } from '../api/PublicSdk.js';
import { GameModuleContext } from '../federation/gameModuleContext.js';
import { AbstractGameSuite, GameSuiteBaseInit } from './AbstractGameSuite.js';
import {
  getDevModeTurns,
  getPlayers,
  getPostgame,
  getPublicRound,
  getSummary,
} from './api.js';
import { connectToSocket, GameSocket } from './socket.js';

export const ROOT_CHAT_SCENE_ID = 'null' as const;

export type PlayerInfo = {
  id: PrefixedId<'u'>;
  displayName: string;
  color: PlayerColorName;
};

/**
 * Implements AbstractGameSuite against a backend game session.
 */
export class GameSessionSuite<
  TGame extends AnyGameDefinition,
> extends AbstractGameSuite<TGame> {
  static load = async (
    gameSessionId: PrefixedId<'gs'>,
    gameModules: GameModuleContext,
    publicSdk: PublicSdk,
  ) => {
    const details = await publicSdk.getGameSessionDetails.run({
      id: gameSessionId,
    });
    return new GameSessionSuite(details, {
      socket: connectToSocket(details.id),
      gameModules,
    });
  };

  constructor(
    init: GameSuiteBaseInit,
    private ctx: {
      socket: GameSocket;
      gameModules: GameModuleContext;
    },
  ) {
    super(init, { gameModules: ctx.gameModules });
    runInAction(() => (this.playerId = init.playerId));

    this.subscribeSocket();
    this.#subscribeWindowEvents();
  }

  connect = () => {
    console.log('connecting...', this.instanceId, 'socket', this.ctx.socket.id);
    return this.ctx.socket.reconnect();
  };
  disconnect = async () => {
    console.log(
      'disconnecting...',
      this.instanceId,
      'socket',
      this.ctx.socket.id,
    );
    // submit turn immediately if delayed
    if (this.isTurnSubmitDelayed) {
      await this.submitTurn().catch(() => {});
    }
    this.ctx.socket.disconnect();
  };

  protected actuallySubmitTurn = async (
    data: GetTurnData<TGame>,
  ): Promise<BaseTurnError | void> => {
    const response = await this.ctx.socket.request({
      type: 'submitTurn',
      turnData: data,
    });
    if (response.type === 'error') {
      throw new LongGameError(LongGameError.Code.Unknown, response.message);
    }
  };

  protected actuallySendChat = async (message: GameSessionChatInit) => {
    await this.ctx.socket.request({
      type: 'sendChat',
      message: message,
    });
  };

  actuallyLoadMoreChat = async (
    nextToken: string | null,
    sceneId: string | null = null,
  ) => {
    this.ctx.socket.send({
      type: 'requestChat',
      nextToken,
      sceneId,
    });
  };

  toggleChatReaction = async (
    chatMessage: GameSessionChatMessage,
    reaction: string,
  ) => {
    const isOn = chatMessage.reactions[reaction]?.includes(this.playerId);
    await this.ctx.socket.request({
      type: 'toggleChatReaction',
      chatMessageId: chatMessage.id,
      isOn: !isOn,
      reaction,
    });
  };

  loadRound = (roundIndex: number) => {
    return getPublicRound<TGame>(this.gameSessionId, roundIndex);
  };

  readyUp = () => {
    this.ctx.socket.send({
      type: 'readyUp',
      unready: false,
    });
  };
  unreadyUp = () => {
    this.ctx.socket.send({
      type: 'readyUp',
      unready: true,
    });
  };
  toggleReady = () => {
    if (this.readyPlayers.includes(this.playerId)) {
      this.unreadyUp();
    } else {
      this.readyUp();
    }
  };

  voteForGame = (gameId: string) => {
    this.ctx.socket.send({
      type: 'voteForGame',
      gameId,
      remove: false,
    });
  };
  removeVoteForGame = (gameId: string) => {
    this.ctx.socket.send({
      type: 'voteForGame',
      gameId,
      remove: true,
    });
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
    this.ctx.socket.subscribe('playerReady', this.onPlayerReady);
    this.ctx.socket.subscribe('playerUnready', this.onPlayerUnready);
    this.ctx.socket.subscribe('playerVoteForGame', this.onPlayerVoteForGame);
    this.ctx.socket.subscribe('gameStarting', this.onGameStarting);
  };

  protected getPostgame = async () => {
    const res = await getPostgame(this.gameSessionId);
    return res.globalState;
  };

  protected getMembers() {
    return getPlayers(this.gameSessionId);
  }

  protected getGameData = async () => {
    const summary = await getSummary(this.gameSessionId);
    const gameDefinition = await this.ctx.gameModules.getGameDefinition(
      summary.gameId || 'empty',
      summary.gameVersion || 'v1',
    );
    return {
      ...summary,
      gameDefinition,
    };
  };

  /**
   * Only works in dev mode
   */
  resetGame = async () => {
    this.ctx.socket.send({
      type: 'resetGame',
    });
  };

  switchPlayer() {
    throw new LongGameError(
      LongGameError.Code.BadRequest,
      'Switching players is not allowed as this is not a hotseat game. This is a bug!',
    );
  }

  protected getDevModeTurns = async () => {
    if (!this.gameSessionId) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot get dev mode turns without a game session ID',
      );
    }
    return getDevModeTurns(this.gameSessionId);
  };

  #subscribeWindowEvents = () => {
    // FIXME: causing infinite suspense???
    // const onVisibilityChange = () => {
    //   if (document.visibilityState === 'visible') {
    //     this.onGameChange();
    //   }
    // };
    // document.addEventListener('visibilitychange', onVisibilityChange);
    // this.#disposes.push(() => {
    //   document.removeEventListener('visibilitychange', onVisibilityChange);
    // });
  };
}
