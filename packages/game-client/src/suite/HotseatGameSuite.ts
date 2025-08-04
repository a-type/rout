import {
  GameRoundSummary,
  GameSessionChatMessage,
  PrefixedId,
} from '@long-game/common';
import {
  BaseTurnError,
  GameDefinition,
  GameMember,
  GetGlobalState,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
} from '@long-game/game-definition';
import { action, runInAction } from 'mobx';
import { GameModuleContext } from '../federation/gameModuleContext.js';
import { HotseatBackend } from '../hotseat/HotseatBackend.js';
import { AbstractGameSuite, GameSuiteBaseInit } from './AbstractGameSuite.js';

export class HotseatGameSuite<
  TGame extends GameDefinition<any, any, any, any, any, any>,
> extends AbstractGameSuite<TGame> {
  static load = async (
    gameSessionId: PrefixedId<'gs'>,
    gameModules: GameModuleContext,
  ) => {
    const backend = await HotseatBackend.open(gameSessionId, gameModules);
    const details = await backend.getDetails();
    return new HotseatGameSuite(
      {
        ...details,
        playerId: details.members[0].id, // Just start with the first player
      },
      { gameModules, backend },
    );
  };

  constructor(
    init: GameSuiteBaseInit,
    private ctx: {
      backend: HotseatBackend;
      gameModules: GameModuleContext;
    },
  ) {
    super(init, { gameModules: ctx.gameModules });
    runInAction(() => {
      this.playerId =
        (localStorage.getItem(`hotseat-last-player:${init.id}`) as
          | PrefixedId<'u'>
          | undefined) || init.playerId;
      this.pickingPlayer = true; // show player picker on launch
    });
    this.ctx.backend.subscribe('chat', this.onChat);
    this.ctx.backend.subscribe('gameChange', this.onGameChange);
    this.ctx.backend.subscribe('roundChange', this.onRoundChange);
    this.ctx.backend.subscribe('turnPlayed', this.onTurnPlayed);
    this.ctx.backend.subscribe('statusChange', this.onStatusChange);
    this.ctx.backend.subscribe('membersChange', this.onMembersChange);
    this.ctx.backend.subscribe('gameStarting', this.onGameStarting);
  }

  get backend() {
    return this.ctx.backend;
  }

  connect(): () => void {
    // no-op
    return this.disconnect;
  }
  disconnect(): void {
    // no-op
  }

  protected loadRound = (
    roundIndex: number,
  ): Promise<
    GameRoundSummary<
      GetTurnData<TGame>,
      GetPublicTurnData<TGame>,
      GetPlayerState<TGame>
    >
  > => {
    return this.ctx.backend.getRound(this.playerId, roundIndex);
  };
  protected actuallySubmitTurn = async (
    data: GetTurnData<TGame>,
  ): Promise<BaseTurnError | void> => {
    console.log(`Submitting turn for round ${this.latestRoundIndex}`, data);
    const error = await this.ctx.backend.submitTurn({
      data,
      playerId: this.playerId,
      roundIndex: this.latestRoundIndex,
      createdAt: new Date().toISOString(),
    });
    if (error) {
      return error;
    }
    // turn was submitted, back to picking player.
    runInAction(() => {
      this.pickingPlayer = true;
    });
  };
  protected actuallySendChat = async (
    message: Omit<GameSessionChatMessage, 'id' | 'createdAt' | 'reactions'>,
  ): Promise<void> => {
    await this.ctx.backend.addChat({
      ...message,
      authorId: this.playerId,
      roundIndex: this.latestRoundIndex,
      reactions: {},
    });
  };
  actuallyLoadMoreChat = async (
    nextToken: string | null,
    sceneId?: string | null,
  ): Promise<void> => {
    const chats = await this.ctx.backend.getChats(sceneId);
    this.onChat({
      type: 'chat',
      messages: chats,
      sceneId: sceneId ?? null,
      nextToken: null, // Hotseat doesn't use pagination
    });
  };
  toggleChatReaction = async (
    chatMessage: GameSessionChatMessage,
    reaction: string,
  ): Promise<void> => {
    // not implemented
  };
  readyUp = (): void => {
    // start immediately.
    this.ctx.backend.startGame();
  };
  unreadyUp = (): void => {
    // no-op, hotseat doesn't have a ready state
  };
  toggleReady = (): void => {
    this.readyUp();
  };
  voteForGame = (gameId: string): void => {
    this.ctx.backend.setGame(gameId);
  };
  removeVoteForGame = (gameId: string): void => {
    throw new Error('Method not implemented.');
  };
  protected getPostgame = async (): Promise<GetGlobalState<TGame> | null> => {
    const { globalState } = await this.ctx.backend.getGlobalState(
      this.latestRoundIndex,
    );
    return globalState;
  };
  protected async getGameData(): Promise<GameSuiteBaseInit> {
    const data = await this.ctx.backend.getDetails();
    console.log('game details', data);
    return {
      ...data,
      playerId: this.playerId,
    };
  }
  protected getMembers = (): Promise<GameMember[]> => {
    return this.ctx.backend.getMembers();
  };
  resetGame = async (): Promise<void> => {
    await this.ctx.backend.resetGame();
  };
  @action switchPlayer = (playerId: PrefixedId<'u'>) => {
    this.playerId = playerId;
    this.pickingPlayer = false;
    localStorage.setItem(`hotseat-last-player:${this.gameSessionId}`, playerId);
    this.events.emit('playerChanged', playerId);
  };

  // not part of public interface, but usable in console
  setSeed = (seed: string): void => {
    this.ctx.backend.setSeed(seed);
  };
}
