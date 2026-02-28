import { EventSubscriber } from '@a-type/utils';
import {
  colorNames,
  GameRoundSummary,
  GameSessionChatInit,
  GameSessionChatMessage,
  gameSessionChatMessageShape,
  GameSessionPlayerStatus,
  GameStatus,
  groupTurnsToRounds,
  id,
  LongGameError,
  PrefixedId,
  randomItem,
  ServerChatMessage,
  ServerGameChangeMessage,
  ServerGameMembersChangeMessage,
  ServerGameStartingMessage,
  ServerRoundChangeMessage,
  ServerStatusChangeMessage,
  ServerTurnPlayedMessage,
  SYSTEM_CHAT_AUTHOR_ID,
} from '@long-game/common';
import {
  BaseTurnError,
  emptyGameDefinition,
  GameDefinition,
  GameMember,
  GameStateCache,
  simpleError,
  Turn,
} from '@long-game/game-definition';
import { DBSchema, deleteDB, IDBPDatabase, openDB } from 'idb';
import { GameModuleContext } from '../federation/gameModuleContext.js';

// combines the data from the GameSession table and the
// basic data in GameSession DO from the backend.
export type HotseatGameDetails = {
  gameSessionId: PrefixedId<'gs'>;
  gameId: string;
  gameVersion: string;
  randomSeed: string;
  createdAt: string;
  startedAt: string | null;
  status: 'pending' | 'active' | 'complete' | 'abandoned';
  members: HotseatPlayer[];
  winnerIds: PrefixedId<'u'>[] | null;
  roundIndex: number;
  setupData?: any; // optional setup data for the game, determined by the game definition
};

type HotseatTurn = Turn<any>;

type HotseatPlayer = GameMember & {
  index: number;
};

interface GameSessionSchema extends DBSchema {
  turns: {
    key: string;
    value: HotseatTurn;
    indexes: { roundIndex: number };
  };
  chat: {
    key: PrefixedId<'cm'>;
    value: GameSessionChatMessage;
    indexes: { sceneId: string };
  };
}

interface GameManagerSchema extends DBSchema {
  sessions: {
    key: PrefixedId<'gs'>;
    value: HotseatGameDetails;
    indexes: { status: 'pending' | 'active' | 'complete' | 'abandoned' };
  };
}
const getManagementDb = () =>
  openDB<GameManagerSchema>('hotseat-list', 1, {
    upgrade(db) {
      const sessions = db.createObjectStore('sessions', {
        keyPath: 'gameSessionId',
      });
      sessions.createIndex('status', 'status', {
        unique: false,
      });
    },
  });

export type HotseatBackendEvents = {
  roundChange: (msg: ServerRoundChangeMessage) => void;
  gameChange: (msg: ServerGameChangeMessage) => void;
  chat: (msg: ServerChatMessage) => void;
  membersChange: (msg: ServerGameMembersChangeMessage) => void;
  turnPlayed: (msg: ServerTurnPlayedMessage) => void;
  statusChange: (msg: ServerStatusChangeMessage) => void;
  gameStarting: (msg: ServerGameStartingMessage) => void;
};

function playerId(index: number): PrefixedId<'u'> {
  return `u-hotseat-${index}` as PrefixedId<'u'>;
}

const defaultGameDetails = (
  sessionId: PrefixedId<'gs'>,
): HotseatGameDetails => ({
  gameId: 'empty',
  gameVersion: '0.0.1',
  randomSeed: Math.random().toString(36).substring(2, 15),
  members: [
    {
      id: playerId(0),
      displayName: 'Player 1',
      index: 0,
      color: randomItem(colorNames),
    },
  ],
  createdAt: new Date().toISOString(),
  startedAt: null,
  status: 'pending',
  winnerIds: null,
  gameSessionId: sessionId,
  roundIndex: -1,
});

export class HotseatBackend extends EventSubscriber<HotseatBackendEvents> {
  readonly sessionId: PrefixedId<'gs'>;
  private db: IDBPDatabase<GameSessionSchema>;
  private managementDb: IDBPDatabase<GameManagerSchema>;
  gameDefinition: GameDefinition = emptyGameDefinition;
  private ctx: GameModuleContext;
  private cache: GameStateCache;

  static open = async (
    sessionId: PrefixedId<'gs'>,
    ctx: GameModuleContext,
  ): Promise<HotseatBackend> => {
    const db = await openDB(`hotseat-${sessionId}`, 1, {
      upgrade(db) {
        const turns = db.createObjectStore('turns');
        turns.createIndex('roundIndex', 'roundIndex');

        const chat = db.createObjectStore('chat', {
          keyPath: 'id',
        });
        chat.createIndex('sceneId', 'sceneId');
      },
    });
    const managementDb = await getManagementDb();
    let gameDetails = await managementDb.get('sessions', sessionId);
    if (!gameDetails) {
      gameDetails = defaultGameDetails(sessionId);
      await managementDb.put('sessions', gameDetails);
      return new HotseatBackend({
        sessionId,
        db,
        ctx,
        gameDefinition: emptyGameDefinition,
        gameDetails,
        managementDb,
      });
    }
    const gameDefinition = await ctx.getGameDefinition(
      gameDetails.gameId,
      gameDetails.gameVersion,
    );
    return new HotseatBackend({
      sessionId,
      db,
      gameDefinition,
      ctx,
      gameDetails,
      managementDb,
    });
  };

  static preSetGame = async (
    sessionId: PrefixedId<'gs'>,
    gameId: string,
    gameDefinition: GameDefinition,
  ) => {
    const managementDb = await getManagementDb();
    let gameDetails = await managementDb.get('sessions', sessionId);
    if (!gameDetails) {
      gameDetails = defaultGameDetails(sessionId);
    }
    gameDetails.gameId = gameId;
    gameDetails.gameVersion = gameDefinition.version;
    gameDetails.randomSeed = Math.random().toString(36).substring(2, 15);
    gameDetails.members = Array.from(
      { length: gameDefinition.minimumPlayers || 1 },
      (_, i) => ({
        id: playerId(i),
        displayName: `Player ${i + 1}`,
        index: i,
        color: randomItem(colorNames),
      }),
    );
    await managementDb.put('sessions', gameDetails);
  };

  static list = async (
    status?: 'pending' | 'active' | 'complete' | 'abandoned',
  ) => {
    const db = await getManagementDb();
    let sessions;
    if (status) {
      sessions = await db.getAllFromIndex('sessions', 'status', status);
    }
    sessions = await db.getAll('sessions');
    return sessions.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  static delete = async (sessionId: PrefixedId<'gs'>) => {
    const db = await getManagementDb();
    await deleteDB(`hotseat-${sessionId}`);
    await db.delete('sessions', sessionId);
  };

  constructor({
    sessionId,
    db,
    gameDefinition,
    ctx,
    gameDetails,
    managementDb,
  }: {
    sessionId: PrefixedId<'gs'>;
    db: IDBPDatabase;
    gameDefinition?: GameDefinition;
    ctx: GameModuleContext;
    gameDetails: HotseatGameDetails;
    managementDb: IDBPDatabase<GameManagerSchema>;
  }) {
    super();
    console.log(gameDetails);
    this.sessionId = sessionId;
    this.db = db as any;
    this.managementDb = managementDb;
    this.gameDefinition = gameDefinition ?? emptyGameDefinition;
    this.cache = new GameStateCache(this.gameDefinition, {
      randomSeed: gameDetails.randomSeed,
      members: gameDetails.members,
      setupData: gameDetails.setupData,
    });
    this.ctx = ctx;
  }

  getMembers = async (): Promise<HotseatPlayer[]> => {
    const details = await this.getDetails();
    return details.members;
  };
  setMemberCount = async (count: number) => {
    if (count === 0) {
      count = 1; // at least one player
    }
    if (count < this.gameDefinition.minimumPlayers) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Cannot set member count below minimum players: ${this.gameDefinition.minimumPlayers}`,
      );
    }
    if (count > this.gameDefinition.maximumPlayers) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Cannot set member count above maximum players: ${this.gameDefinition.maximumPlayers}`,
      );
    }
    const details = await this.getDetails();
    if (details.members.length === count) {
      return;
    }
    if (details.members.length > count) {
      // remove excess members
      const newMembers = details.members.slice(0, count);
      await this.updateDetails({
        members: newMembers,
      });
    }
    if (details.members.length < count) {
      // add new members
      const newMembers: HotseatPlayer[] = [];
      for (let i = details.members.length; i < count; i++) {
        newMembers.push({
          id: playerId(i),
          displayName: `Player ${i + 1}`,
          index: i,
          color: randomItem(colorNames),
        });
      }
      await this.updateDetails({
        members: [...details.members, ...newMembers],
      });
    }
    this.emit('membersChange', {
      type: 'membersChange',
      members: await this.getMembers(),
    });
  };
  setPlayerDisplayName = async (
    playerId: PrefixedId<'u'>,
    displayName: string,
  ) => {
    const details = await this.getDetails();
    const member = details.members.find((m) => m.id === playerId);
    if (!member) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Player with id ${playerId} not found`,
      );
    }
    if (member.displayName === displayName) {
      return; // no change
    }
    const newMembers = details.members.map((m) =>
      m.id === playerId ? { ...m, displayName } : m,
    );
    await this.updateDetails({
      members: newMembers,
    });
    this.emit('membersChange', {
      type: 'membersChange',
      members: newMembers,
    });
  };

  updateDetails = async (partial: Partial<HotseatGameDetails>) => {
    const rawDetails = await this.managementDb.get('sessions', this.sessionId);
    if (!rawDetails) {
      throw new Error('Game details not found');
    }
    const details: HotseatGameDetails = {
      ...rawDetails,
      ...partial,
    };
    await this.managementDb.put('sessions', details);
    this.cache = new GameStateCache(this.gameDefinition, {
      randomSeed: details.randomSeed,
      members: details.members,
      setupData: details.setupData,
    });
    return details;
  };
  getDetails = async () => {
    const details = await this.managementDb.get('sessions', this.sessionId);
    if (!details) {
      throw new Error('Game details not found');
    }

    const gameDefinition = await this.ctx.getGameDefinition(
      details.gameId,
      details.gameVersion,
    );
    const turns = await this.db.getAll('turns');
    const globalState = this.cache.getState(groupTurnsToRounds(turns));
    const { roundIndex, pendingTurns } =
      details.status === 'pending'
        ? { roundIndex: -1, pendingTurns: [] }
        : gameDefinition.getRoundIndex({
            currentTime: new Date(),
            environment: 'production',
            gameTimeZone: 'UTC',
            globalState,
            members: details.members,
            startedAt: new Date(details.startedAt || details.createdAt),
            turns,
          });
    const playerStatuses = Object.fromEntries(
      details.members.map((member) => [
        member.id,
        {
          online: true,
          pendingTurn: pendingTurns.includes(member.id),
        } satisfies GameSessionPlayerStatus,
      ]),
    );
    const gameStatus =
      details.status === 'active'
        ? // edge case -- gameDefinition.getStatus could return 'pending'
          // if there are no turns, but we already did start the game.
          turns.length === 0
          ? { status: 'active' as const }
          : gameDefinition.getStatus({
              globalState,
              rounds: groupTurnsToRounds(turns),
              members: details.members,
            })
        : ({
            status: details.status,
          } as GameStatus);
    if (gameStatus.status === 'pending' && details.status === 'active') {
      debugger;
    }
    return {
      id: details.gameSessionId,
      ...details,
      currentRoundIndex: details.status !== 'pending' ? roundIndex : 0,
      playerStatuses,
      gameDefinition,
      status: gameStatus,
      timezone: 'UTC',
      readyPlayers: [],
      gameVotes: {},
    };
  };
  setGame = async (gameId: string) => {
    const details = await this.getDetails();
    const version = await this.ctx.getGameLatestVersion(gameId);
    this.gameDefinition = await this.ctx.getGameDefinition(gameId, version);
    // lock in setup data
    const setupData = this.gameDefinition.getSetupData?.({
      members: details.members,
    });
    await this.updateDetails({
      gameId,
      gameVersion: version,
      randomSeed: Math.random().toString(36).substring(2, 15),
      setupData,
    });
    if (details.members.length < this.gameDefinition.minimumPlayers) {
      await this.setMemberCount(this.gameDefinition.minimumPlayers);
    } else if (details.members.length > this.gameDefinition.maximumPlayers) {
      await this.setMemberCount(this.gameDefinition.maximumPlayers);
    }
    this.emit('gameChange', {
      type: 'gameChange',
    });
  };
  setSeed = async (seed: string) => {
    const details = await this.getDetails();
    if (details.status.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot change seed after game has started',
      );
    }
    if (!seed) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Seed cannot be empty',
      );
    }
    if (seed === details.randomSeed) {
      return; // no change
    }
    await this.updateDetails({
      randomSeed: seed,
    });
    this.emit('gameChange', {
      type: 'gameChange',
    });
  };
  startGame = async () => {
    const details = await this.getDetails();
    if (details.status.status !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game already started',
      );
    }
    this.updateDetails({
      status: 'active',
      startedAt: new Date().toISOString(),
    });
    this.emit('gameStarting', {
      type: 'gameStarting',
      startsAt: new Date().toISOString(),
    });
    setTimeout(() => {
      this.emit('statusChange', {
        type: 'statusChange',
        status: {
          status: 'active',
        },
      });
      this.checkRoundChange();
    }, 1000);
  };

  #getTurnsUpToRound = async (roundLte: number) => {
    const tx = this.db.transaction('turns', 'readonly');
    const store = tx.objectStore('turns');
    const index = store.index('roundIndex');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(roundLte));
    const turns: HotseatTurn[] = [];
    while (cursor) {
      turns.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;
    return turns;
  };

  getGlobalState = async (roundIndex: number) => {
    const turns = await this.#getTurnsUpToRound(roundIndex);
    const rounds = groupTurnsToRounds(turns);
    const globalState = this.cache.getState(rounds);
    return { rounds, globalState };
  };
  getPlayerState = async (playerId: PrefixedId<'u'>, roundIndex: number) => {
    const { rounds, globalState } = await this.getGlobalState(roundIndex);
    const members = await this.getMembers();
    return this.gameDefinition.getPlayerState({
      globalState,
      playerId,
      members,
      rounds,
      // WARN: FIXME: bug could happen if passing roundIndex
      // naively, since it can be -1...
      roundIndex: rounds.length,
      playerTurn:
        rounds[roundIndex]?.turns.find((turn) => turn.playerId === playerId) ??
        null,
    });
  };

  getTurns = async (roundIndex: number): Promise<HotseatTurn[]> => {
    return await this.db.getAllFromIndex('turns', 'roundIndex', roundIndex);
  };
  getRound = async (
    playerId: PrefixedId<'u'>,
    roundIndex: number,
  ): Promise<GameRoundSummary<any, any, any>> => {
    const turns = await this.getTurns(roundIndex);
    const initialPlayerState = await this.getPlayerState(
      playerId,
      roundIndex - 1,
    );
    return {
      roundIndex,
      turns: turns.map((turn) => {
        if (turn.playerId === playerId) {
          return {
            ...turn,
            data: null, // don't send the player's own turn data
          };
        }
        return turn;
      }),
      initialPlayerState,
      yourTurnData:
        turns.find((turn) => turn.playerId === playerId)?.data ?? null,
    };
  };
  submitTurn = async (turn: Turn<any>): Promise<BaseTurnError | void> => {
    const params = {
      playerState: await this.getPlayerState(
        turn.playerId,
        turn.roundIndex - 1,
      ),
      members: await this.getMembers(),
      turn,
      roundIndex: turn.roundIndex,
    };
    const error =
      this.gameDefinition.validatePartialTurn?.(params) ||
      this.gameDefinition.validateTurn(params);

    if (error) {
      if (typeof error === 'string') {
        return simpleError(error);
      }
      return error;
    }

    await this.db.put('turns', turn, `${turn.playerId}-${turn.roundIndex}`);
    this.emit('turnPlayed', {
      type: 'turnPlayed',
      roundIndex: turn.roundIndex,
      turn: {
        ...turn,
        data: null,
      },
    });
    this.checkRoundChange();
  };

  private checkRoundChange = async () => {
    const turns = await this.db.getAll('turns');
    const rounds = groupTurnsToRounds(turns);
    const details = await this.getDetails();
    const globalState = await this.cache.getState(rounds);
    const roundInfo = this.gameDefinition.getRoundIndex({
      currentTime: new Date(),
      environment: 'production',
      gameTimeZone: 'UTC',
      globalState,
      members: await this.getMembers(),
      startedAt: new Date(details.startedAt || Date.now()),
      turns,
    });
    if (roundInfo.roundIndex > details.roundIndex) {
      this.emit('roundChange', {
        playerStatuses: Object.fromEntries(
          details.members.map((member) => [
            member.id,
            {
              online: true,
              pendingTurn: roundInfo.pendingTurns.includes(member.id),
            } satisfies GameSessionPlayerStatus,
          ]),
        ),
        newRoundIndex: roundInfo.roundIndex,
        type: 'roundChange',
      });
      if (this.gameDefinition.getRoundChangeMessages) {
        const messages = this.gameDefinition.getRoundChangeMessages({
          globalState,
          completedRound: rounds[roundInfo.roundIndex - 1],
          members: details.members,
          roundIndex: roundInfo.roundIndex - 1,
          newRound: {
            roundIndex: roundInfo.roundIndex,
            turns: rounds[roundInfo.roundIndex]?.turns ?? [],
          },
          rounds,
        });
        if (messages?.length) {
          for (const message of messages) {
            await this.addChat({
              ...message,
              authorId: SYSTEM_CHAT_AUTHOR_ID,
              roundIndex: roundInfo.roundIndex,
            });
          }
        }
      }
    }
    const status = this.gameDefinition.getStatus({
      globalState,
      rounds,
      members: details.members,
    });
    if (status !== details.status) {
      this.emit('statusChange', {
        type: 'statusChange',
        status,
      });
      this.updateDetails({
        status: status.status,
        winnerIds: status.status === 'complete' ? status.winnerIds : [],
      });
    }
  };

  getChats = async (
    sceneId?: string | null,
  ): Promise<GameSessionChatMessage[]> => {
    const tx = this.db.transaction('chat', 'readonly');
    const store = tx.objectStore('chat');
    const index = store.index('sceneId');
    let cursor = await index.openCursor(IDBKeyRange.only(sceneId ?? null));
    const messages: GameSessionChatMessage[] = [];
    while (cursor) {
      messages.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;
    return messages;
  };
  addChat = async (message: GameSessionChatInit) => {
    const chatMessage = gameSessionChatMessageShape.parse({
      ...message,
      id: id('cm'),
      createdAt: new Date().toISOString(),
      reactions: {},
    });
    await this.db.put('chat', chatMessage);
    this.emit('chat', {
      type: 'chat',
      messages: [chatMessage],
      sceneId: chatMessage.sceneId || null,
      nextToken: null, // Hotseat doesn't use pagination
    });
    return chatMessage;
  };

  resetGame = async () => {
    const details = await this.getDetails();
    const setupData = this.gameDefinition.getSetupData?.({
      members: details.members,
    });
    await this.db.clear('turns');
    await this.updateDetails({
      status: 'pending',
      startedAt: null,
      roundIndex: -1,
      setupData,
    });
    this.emit('gameChange', {
      type: 'gameChange',
    });
  };
}
