import {
  chatPositionShape,
  chatReactionsShape,
  deduplicatePlayerColors,
  GameRound,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  groupTurnsToRounds,
  id,
  LongGameError,
  PrefixedId,
  safeParse,
  safeParseMaybe,
  SYSTEM_CHAT_AUTHOR_ID,
} from '@long-game/common';
import {
  BaseTurnData,
  emptyGameDefinition,
  GameMember,
  GameStateCache,
  getLatestVersion,
  RoundIndexResult,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { addDays, addSeconds, setHours, startOfDay } from 'date-fns';
import { z } from 'zod';
import { notifyUser } from '../../services/notification.js';
import { getNotificationScheduler } from '../notificationScheduler/NotificationScheduler.js';
import { Scheduler } from '../Scheduler.js';
import { SqlWrapper } from '../SqlWrapper.js';
import { GameSessionPresence } from './GameSessionPresence.js';
import { GameSessionSocketHandler } from './GameSessionSocketHandler.js';
import { ChatMessage, db, migrations } from './sql.js';

export interface GameSessionBaseData {
  id: PrefixedId<'gs'>;
  randomSeed: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  abandonedAt?: string | null;
  gameId?: string;
  gameVersion?: string;
  timezone: string;
  members: GameSessionMember[];
  createdBy?: PrefixedId<'u'>;
}

export type GameSessionTurn = Turn<{}>;

/**
 * These member stubs connect to User ids in the core database,
 * but don't store any redundant data about those users, which
 * is irrelevant to the game state. Look up the users from
 * the core database when needed.
 * These are objects to allow future extension if necessary.
 */
export type GameSessionMember = GameMember;

interface GameSessionRoundState {
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

type ScheduledTasks =
  | {
      type: 'checkRound';
    }
  | {
      type: 'startGame';
    }
  | {
      type: 'turnReminders';
    };
const startGameTaskId = '@@startGame';

export class GameSession extends DurableObject<ApiBindings> {
  #sql: SqlWrapper;
  #socketHandler: GameSessionSocketHandler;
  #stateCache: GameStateCache | undefined;
  #scheduler: Scheduler<ScheduledTasks>;
  readonly presence: GameSessionPresence;
  #cachedGameSessionId: PrefixedId<'gs'> | null = null;

  constructor(ctx: DurableObjectState, env: ApiBindings) {
    super(ctx, env);
    this.#sql = new SqlWrapper(ctx.storage, migrations);
    this.presence = new GameSessionPresence(ctx);
    this.#socketHandler = new GameSessionSocketHandler(this, ctx, env);
    this.#scheduler = new Scheduler(
      this.#sql,
      ctx.storage,
      this.handleScheduledTask,
      this.log,
    );
    this.#startup();
  }

  log = (level: 'debug' | 'info' | 'warn' | 'error', ...args: any[]) => {
    console[level](`[👾 ${this.#cachedGameSessionId ?? 'unknown'}]`, ...args);
  };

  // socket delegation
  fetch(req: Request) {
    return this.#socketHandler.fetch(req);
  }
  webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): void | Promise<void> {
    return this.#socketHandler.onMessage(ws, message);
  }
  webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): void | Promise<void> {
    return this.#socketHandler.onClose(ws, code, reason, wasClean);
  }
  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
    return this.#socketHandler.onError(ws, error);
  }

  // accessors for stored state --
  // these return promises but the inherent caching layer of DOs means
  // they should resolve immediately.
  async #getSessionData(): Promise<GameSessionBaseData> {
    const data = await this.#maybeGetSessionData();
    if (!data) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    return data as GameSessionBaseData;
  }
  async #maybeGetSessionData(): Promise<GameSessionBaseData | null> {
    const data = await this.ctx.storage.get<GameSessionBaseData>('sessionData');
    if (!data) {
      return null;
    }
    return data;
  }
  async #hasSessionData(): Promise<boolean> {
    const data = await this.#maybeGetSessionData();
    return Boolean(data);
  }
  async #setSessionData(data: GameSessionBaseData) {
    await this.ctx.storage.put('sessionData', data);
    // invalidate state cache -- if members or random seed change,
    // it's no longer valid and must be recomputed
    this.#stateCache = undefined;
    return data;
  }
  async #updateSessionData(updates: Partial<GameSessionBaseData>) {
    const data = await this.#getSessionData();
    return this.#setSessionData({ ...data, ...updates });
  }
  async #getRoundState(): Promise<GameSessionRoundState> {
    return (
      (await this.ctx.storage.get('notifications')) || {
        playersNotified: {},
        roundIndex: -1,
      }
    );
  }
  async #setRoundState(notifications: GameSessionRoundState) {
    await this.ctx.storage.put('notifications', notifications);
    return notifications;
  }
  async #getSetupData(): Promise<any> {
    return this.ctx.storage.get('setupData');
  }
  async #setSetupData(setupData: any) {
    await this.ctx.storage.put('setupData', setupData);
    return setupData;
  }

  // things to do when the DO starts up - could happen on launch
  // or restoring after hibernation
  async #startup() {
    const { status } = await this.getStatus();
    if (status === 'active') {
      await this.#scheduleTurnRemindersTask();
      this.log('info', `Scheduled turn reminders task.`);
    }
  }

  // turns use the SQL API
  async #listTurns({
    roundLte,
    roundIndex,
    playerId,
  }: {
    roundLte?: number;
    roundIndex?: number;
    playerId?: PrefixedId<'u'>;
  } = {}): Promise<GameSessionTurn[]> {
    let sql = db
      .selectFrom('Turn')
      .selectAll()
      .orderBy('Turn.roundIndex asc')
      .orderBy('Turn.createdAt asc');
    if (roundIndex !== undefined) {
      sql = sql.where('Turn.roundIndex', '=', roundIndex);
    } else if (roundLte !== undefined) {
      sql = sql.where('Turn.roundIndex', '<=', roundLte);
    }
    if (playerId) {
      sql = sql.where('Turn.playerId', '=', playerId);
    }
    const result = await this.#sql.run(sql);
    return result.map((row) => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  // Metadata and setup stuff
  async getIsInitialized(): Promise<boolean> {
    return this.#hasSessionData();
  }
  async getId(): Promise<PrefixedId<'gs'>> {
    return (await this.#getSessionData()).id;
  }
  async getHasGameStarted(): Promise<boolean> {
    const sessionData = await this.#getSessionData();
    return Boolean(sessionData.startedAt);
  }
  async getGameDefinition() {
    const { gameId, gameVersion } = await this.#getSessionData();
    if (!gameId || !gameVersion) {
      return emptyGameDefinition;
    }

    const gameModule = games[gameId];
    if (!gameModule) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        `Game ${gameId} not found`,
      );
    }
    const gameDefinition = gameModule.versions.find(
      (g) => g.version === gameVersion,
    );
    if (!gameDefinition) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        `Game ${gameId} version ${gameVersion} not found`,
      );
    }
    return gameDefinition;
  }
  /** Guarantees stable ordering once game is underway */
  async getMembers(): Promise<GameSessionMember[]> {
    return (await this.#getSessionData()).members
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(
        (member: { id: PrefixedId<'u'> }): GameSessionMember => ({
          // back-compat -- fill in missing data
          displayName: `Player ${member.id}`,
          color: 'gray', // default color, can be overridden by game definition
          ...member,
        }),
      );
  }

  async getIsReady(playerId: PrefixedId<'u'>): Promise<boolean> {
    const existingReadyUp = await this.#sql.run(
      db
        .selectFrom('ReadyUp')
        .select('createdAt')
        .where('userId', '=', playerId),
    );
    return !!existingReadyUp.length;
  }

  async getReadyPlayers(): Promise<PrefixedId<'u'>[]> {
    const result = await this.#sql.run(
      db.selectFrom('ReadyUp').select('userId'),
    );
    return result.map((row) => row.userId);
  }
  async getAllPlayersReady() {
    const members = await this.getMembers();
    const readyPlayers = await this.getReadyPlayers();
    return members.length > 0 && members.length === readyPlayers.length;
  }

  async readyUp(playerId: PrefixedId<'u'>) {
    if (await this.getIsReady(playerId)) {
      // since this method sends a notification, check before continuing
      // to avoid duplicate notifications.
      return;
    }
    await this.#sql.run(
      db
        .insertInto('ReadyUp')
        .values({ userId: playerId, createdAt: new Date().toISOString() })
        // ... but still have redundancy
        .onConflict((oc) => oc.column('userId').doNothing()),
    );
    this.#socketHandler.send({
      type: 'playerReady',
      playerId,
    });

    // if all players are ready, set a timer to start the game in 5 seconds
    const readyPlayers = await this.getReadyPlayers();
    const members = await this.getMembers();
    if (readyPlayers.length === members.length) {
      const startsAt = addSeconds(new Date(), 5);
      this.#scheduler.scheduleTask(
        startsAt,
        {
          type: 'startGame',
        },
        startGameTaskId,
      );
      this.log('debug', 'All players ready. Starting game in 5 seconds');
      this.#socketHandler.send({
        type: 'gameStarting',
        startsAt: startsAt.toISOString(),
      });
    }
  }
  async unreadyUp(playerId: PrefixedId<'u'>) {
    await this.#sql.run(
      db.deleteFrom('ReadyUp').where('userId', '=', playerId),
    );
    this.#socketHandler.send({
      type: 'playerUnready',
      playerId,
    });
    this.#scheduler.cancelTask(startGameTaskId);
  }

  async getGameVotes(): Promise<Record<string, PrefixedId<'u'>[]>> {
    const result = await this.#sql.run(
      db
        .selectFrom('GameVote')
        .select(['gameId', 'userId'])
        .orderBy('createdAt', 'asc'),
    );
    const votes: Record<string, PrefixedId<'u'>[]> = {};
    for (const row of result) {
      if (!votes[row.gameId]) {
        votes[row.gameId] = [];
      }
      votes[row.gameId].push(row.userId);
    }
    return votes;
  }

  async voteForGame(playerId: PrefixedId<'u'>, gameId: string) {
    // if this is the game leader, or if the game has no leader,
    // we select the game immediately
    const sessionData = await this.#getSessionData();
    if (!sessionData.createdBy || sessionData.createdBy === playerId) {
      await this.updateGame(gameId, getLatestVersion(games[gameId]).version);
      return;
    }

    await this.#sql.run(
      db
        .insertInto('GameVote')
        .values({
          userId: playerId,
          gameId,
          createdAt: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.columns(['userId', 'gameId']).doUpdateSet({
            gameId,
            createdAt: new Date().toISOString(),
          }),
        ),
    );
    // send an update
    this.#socketHandler.send({
      type: 'playerVoteForGame',
      playerId,
      votes: await this.getGameVotes(),
    });
  }
  async removeVoteForGame(playerId: PrefixedId<'u'>, gameId: string) {
    await this.#sql.run(
      db
        .deleteFrom('GameVote')
        .where('userId', '=', playerId)
        .where('gameId', '=', gameId),
    );
    // send an update
    this.#socketHandler.send({
      type: 'playerVoteForGame',
      playerId,
      votes: await this.getGameVotes(),
    });
  }

  async #getStateCache(): Promise<GameStateCache> {
    if (this.#stateCache) return this.#stateCache;
    const sessionData = await this.#getSessionData();
    const gameDefinition = await this.getGameDefinition();
    const setupData = await this.#getSetupData();
    if (!sessionData || !gameDefinition) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        `Cannot get game state before session is initialized`,
      );
    }
    const cache = new GameStateCache(gameDefinition, {
      randomSeed: sessionData.randomSeed,
      members: sessionData.members,
      setupData,
    });
    this.#stateCache = cache;
    return cache;
  }

  async delete() {
    if (await this.getIsInitialized()) {
      const sessionData = await this.#getSessionData();
      // if (sessionData.startedAt) {
      //   throw new LongGameError(
      //     LongGameError.Code.BadRequest,
      //     'Cannot delete a game session that has started',
      //   );
      // }
    }
    return this.#delete();
  }
  async #delete() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  /** Setup */
  async initialize(
    data: Pick<
      GameSessionBaseData,
      | 'id'
      | 'randomSeed'
      | 'gameId'
      | 'gameVersion'
      | 'timezone'
      | 'members'
      | 'createdBy'
    >,
  ): Promise<GameSessionBaseData> {
    if (await this.#hasSessionData()) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data already initialized',
      );
    }
    const sessionData = {
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      ...data,
    };
    await this.#setSessionData(sessionData);
    await this.#updateStatus('pending');
    return sessionData;
  }
  async updateMembers(members: GameSessionMember[]): Promise<void> {
    const sessionData = await this.#getSessionData();
    if (sessionData.startedAt) {
      // once game has started, we can only update metadata for existing members, not
      // add new ones or remove existing ones.
      const existingMemberIds = new Set(sessionData.members.map((m) => m.id));
      for (const member of members) {
        if (!existingMemberIds.has(member.id)) {
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            `Cannot add new member ${member.id} after game has started`,
          );
        } else {
          existingMemberIds.delete(member.id);
        }
      }
      // we should have removed every member during our iteration
      if (existingMemberIds.size > 0) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          `Cannot remove members after game has started: ${Array.from(
            existingMemberIds,
          ).join(', ')}`,
        );
      }
    }
    // deduplicate colors - if a color has been used, reassign a random unused one.
    members = deduplicatePlayerColors(members);
    await this.#updateSessionData({ members });

    this.#socketHandler.send({
      type: 'membersChange',
      members: await this.getMembers(),
    });
  }
  async updateGame(
    gameId: string,
    gameVersion: string,
    userId?: PrefixedId<'u'>,
  ): Promise<void> {
    const sessionData = await this.#getSessionData();
    if (sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update game after game has started',
      );
    }
    if (sessionData.createdBy && userId && sessionData.createdBy !== userId) {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Only the creator of the game session can change the game',
      );
    }
    await this.#updateSessionData({ gameId, gameVersion });
    await this.env.ADMIN_STORE.updateGameSession(sessionData.id, {
      gameId,
      gameVersion,
    });
    this.#socketHandler.send({
      type: 'gameChange',
    });
  }
  async startGame(): Promise<void> {
    const sessionData = await this.#getSessionData();
    if (sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game already started',
      );
    }

    if (!sessionData.gameId || !sessionData.gameVersion) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot start game without game selected',
      );
    }

    // last chance to set game version before beginning
    const gameModule = games[sessionData.gameId];
    if (!gameModule) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        `Game ${sessionData.gameId} not found`,
      );
    }

    const gameDefinition = getLatestVersion(gameModule);

    await this.updateGame(sessionData.gameId, gameDefinition.version);
    // lock in setup data, if available
    if (gameDefinition.getSetupData) {
      const setupData = gameDefinition.getSetupData({
        members: sessionData.members,
      });
      await this.#setSetupData(setupData);
    }
    await this.#updateStatus('active');

    await this.#checkForRoundChange();
  }
  async abandonGame(abandoningPlayerId: PrefixedId<'u'>) {
    // abandoning an in-progress game ends it.
    // abandoning a pregame just causes the player to leave.
    const sessionData = await this.#getSessionData();
    if (sessionData.startedAt) {
      this.#updateStatus('abandoned');
    } else {
      const members = await this.getMembers();
      await this.updateMembers(
        members.filter((member) => member.id !== abandoningPlayerId),
      );
      // that's all we have to do.
    }
  }

  // Game state and status
  /**
   * Computed method! Store the returned value if possible for reuse.
   * Returns the active round index. 0 is the first round.
   * Note that despite this value being the current round,
   * all information delivered to the player should use
   * getPublicRoundIndex, which is 1 behind. The current round
   * will include submitted turns before the round is complete.
   */
  async getCurrentRoundIndex() {
    return (await this.#getCurrentRoundState()).roundIndex;
  }
  async getPublicRoundIndex() {
    return (await this.getCurrentRoundIndex()) - 1;
  }

  async getRounds(upToAndIncludingIndex?: number) {
    const publicRoundIndex = await this.getPublicRoundIndex();
    if (upToAndIncludingIndex !== undefined) {
      if (upToAndIncludingIndex > publicRoundIndex) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Cannot get rounds for future rounds. Play your turn and see what happens!',
        );
      }
    } else {
      upToAndIncludingIndex = publicRoundIndex;
    }
    return this.#getRoundsUnchecked({
      upToAndIncluding: upToAndIncludingIndex,
    });
  }

  async getTurns() {
    if (!this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot get raw turns in outside of dev mode',
      );
    }
    return this.#listTurns();
  }
  async getPlayerState(
    playerId: PrefixedId<'u'>,
    upToAndIncludingRoundIndex?: number,
  ): Promise<{}> {
    const publicRoundIndex = await this.getPublicRoundIndex();
    if (
      upToAndIncludingRoundIndex !== undefined &&
      upToAndIncludingRoundIndex > publicRoundIndex
    ) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot get player state for future rounds. Play your turn and see what happens!',
      );
    }
    return (await this.#getPlayerStateUnchecked(
      playerId,
      upToAndIncludingRoundIndex,
    )) as any;
  }
  async getPublicRound(playerId: PrefixedId<'u'>, roundIndex: number) {
    const currentRoundIndex = await this.getCurrentRoundIndex();
    if (roundIndex > currentRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot get player rounds for future rounds. Play your turn and see what happens!',
      );
    }
    const round = await this.#getRound(roundIndex);
    const gameDefinition = await this.getGameDefinition();
    const globalState = await this.#getGlobalStateUnchecked(roundIndex);
    const initialPlayerState: any = await this.#getPlayerStateUnchecked(
      playerId,
      roundIndex - 1,
    );
    return {
      ...round,
      initialPlayerState: initialPlayerState as {},
      yourTurnData:
        round.turns.find((t) => t.playerId === playerId)?.data ?? null,
      turns: round.turns.map((turn) => {
        // do not show turn data for the current round, only show which players have
        // played a turn.
        if (roundIndex === currentRoundIndex && turn.playerId !== playerId) {
          return {
            playerId: turn.playerId,
            data: null,
          };
        }
        return gameDefinition.getPublicTurn({
          turn,
          globalState,
          viewerId: playerId,
        });
      }),
    };
  }
  // users can get global state in dev mode or after game has ended
  async getGlobalState(): Promise<unknown> {
    if (
      !this.env.DEV_MODE &&
      !((await this.getStatus()).status !== 'complete')
    ) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot get global state until game is over',
      );
    }
    return await this.#getGlobalStateUnchecked();
  }
  async getPlayerStatuses(): Promise<
    Record<PrefixedId<'u'>, GameSessionPlayerStatus>
  > {
    const members = await this.getMembers();
    const roundState = await this.#getCurrentRoundState();
    const statuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus> = {};
    for (const member of members) {
      statuses[member.id] = {
        online: await this.presence.getIsOnline(member.id),
        pendingTurn: roundState.pendingTurns.includes(member.id),
      };
    }
    return statuses;
  }
  async getPlayerIsPendingTurn(playerId: PrefixedId<'u'>) {
    const roundState = await this.#getCurrentRoundState();
    return roundState.pendingTurns.includes(playerId);
  }
  async getPlayerLatestPlayedRoundIndex(
    playerId: PrefixedId<'u'>,
  ): Promise<number> {
    const result = await this.#sql.run(
      db
        .selectFrom('Turn')
        .where('Turn.playerId', '=', playerId)
        .orderBy('Turn.roundIndex', 'desc')
        .select('Turn.roundIndex')
        .limit(1),
    );
    if (result.length === 0) {
      return -1;
    }
    return result[0].roundIndex;
  }
  async addTurn(playerId: PrefixedId<'u'>, turn: BaseTurnData) {
    const status = await this.getStatus();
    if (status.status !== 'active') {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot add turn when game is not active',
      );
    }

    const gameDefinition = await this.getGameDefinition();
    const members = await this.getMembers();
    const currentRoundIndex = await this.getCurrentRoundIndex();
    const playerState = await this.#getPlayerStateUnchecked(
      playerId,
      currentRoundIndex - 1,
    );

    const params = {
      turn: {
        data: turn,
        playerId,
      },
      playerState,
      roundIndex: currentRoundIndex,
      members,
    };
    const validationError =
      gameDefinition.validatePartialTurn?.(params) ||
      gameDefinition.validateTurn(params);
    if (validationError) {
      const msg =
        typeof validationError === 'string'
          ? validationError
          : validationError.message;
      throw new LongGameError(LongGameError.Code.BadRequest, msg);
    }

    this.log(
      'debug',
      `Adding turn for player ${playerId} in round ${currentRoundIndex}`,
    );
    await this.#applyTurn(turn, playerId, currentRoundIndex);
    this.log(
      'debug',
      `Turn added for player ${playerId} in round ${currentRoundIndex}`,
    );

    await this.#checkForRoundChange();
  }
  async getCurrentTurn(playerId: PrefixedId<'u'>): Promise<{
    data: unknown;
    roundIndex: number;
    playerId: PrefixedId<'u'>;
  } | null> {
    const currentRoundIndex = await this.getCurrentRoundIndex();
    const result = await this.#sql.run(
      db
        .selectFrom('Turn')
        .where('Turn.playerId', '=', playerId)
        .where('Turn.roundIndex', '=', currentRoundIndex)
        .selectAll(),
    );
    if (result.length === 0) {
      return null;
    }
    const turn = result[0];
    return {
      data: JSON.parse(turn.data),
      roundIndex: turn.roundIndex,
      playerId: turn.playerId,
    };
  }
  async getStatus(): Promise<GameStatus> {
    if (!(await this.#hasSessionData())) {
      return { status: 'pending' };
    }
    const sessionData = await this.#getSessionData();
    if (!sessionData.startedAt) {
      return { status: 'pending' };
    }
    if (sessionData.abandonedAt) {
      return { status: 'abandoned' };
    }

    const gameDefinition = await this.getGameDefinition();
    const publicRoundIndex = await this.getPublicRoundIndex();
    return gameDefinition.getStatus({
      globalState: await this.#getGlobalStateUnchecked(publicRoundIndex),
      rounds: await this.#getRoundsUnchecked({
        upToAndIncluding: publicRoundIndex,
      }),
      members: await this.getMembers(),
    });
  }

  async getDetails() {
    const sessionData = await this.#getSessionData();
    const roundData = await this.#getCurrentRoundState();
    const status = await this.getStatus();
    const members = await this.getMembers();
    const playerStatuses = await this.getPlayerStatuses();
    const gameVotes = await this.getGameVotes();
    const readyPlayers = await this.getReadyPlayers();
    return {
      id: sessionData.id,
      status,
      gameId: sessionData.gameId,
      gameVersion: sessionData.gameVersion,
      members,
      startedAt: sessionData.startedAt,
      timezone: sessionData.timezone,
      endedAt: sessionData.endedAt,
      nextRoundCheckAt: roundData.checkAgainAt?.toISOString() ?? null,
      currentRoundIndex: roundData.roundIndex,
      playerStatuses,
      createdBy: sessionData.createdBy ?? null,
      gameVotes,
      readyPlayers,
    };
  }
  async resetGame() {
    if (!this.env.DEV_MODE) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot reset game outside of dev mode',
      );
    }
    await this.#sql.run(db.deleteFrom('Turn'));
    await this.#setRoundState({
      roundIndex: -1,
      playersNotified: {},
    });
    await this.#checkForRoundChange();
    this.#socketHandler.send({
      type: 'gameChange',
    });
  }

  // chat
  async addChatMessage(message: GameSessionChatMessage) {
    this.log('debug', `Chat message from ${message.authorId}`);
    const query = db
      .insertInto('ChatMessage')
      .values({
        id: message.id,
        createdAt: new Date(message.createdAt).toISOString(),
        authorId: message.authorId,
        content: message.content,
        roundIndex: message.roundIndex,
        metadataJSON: message.metadata
          ? JSON.stringify(message.metadata)
          : null,
        positionJSON: message.position
          ? JSON.stringify(message.position)
          : null,
        recipientIdsList: message.recipientIds
          ? this.#encodeChatRecipientIds(message.recipientIds)
          : null,
        sceneId: message.sceneId,
        reactionsJSON: JSON.stringify(message.reactions),
      })
      .onConflict((oc) => oc.column('id').doNothing());
    await this.#sql.run(query);
    this.#socketHandler.send(
      {
        type: 'chat',
        messages: [message],
        sceneId: message.sceneId ?? null,
      },
      {
        to: message.recipientIds,
      },
    );
  }
  #encodeChatPageToken(createdAt: string): string {
    return Buffer.from(createdAt).toString('base64');
  }
  #decodeChatPageToken(token: string): string {
    return Buffer.from(token, 'base64').toString('utf-8');
  }
  #encodeChatRecipientIds(recipientIds: PrefixedId<'u'>[]): string {
    return ',' + recipientIds.join(',') + ',';
  }
  #decodeChatRecipientIds(token: string): PrefixedId<'u'>[] {
    return token.split(',').filter(Boolean) as PrefixedId<'u'>[];
  }
  #hydrateChatMessage = (row: ChatMessage) => {
    let recipientIds = row.recipientIdsList
      ? this.#decodeChatRecipientIds(row.recipientIdsList)
      : undefined;
    if (recipientIds?.length === 0) {
      recipientIds = undefined;
    }
    return {
      ...row,
      sceneId: row.sceneId ?? undefined,
      createdAt: new Date(row.createdAt).toISOString(),
      position: row.positionJSON
        ? safeParseMaybe(row.positionJSON, chatPositionShape)
        : undefined,
      recipientIds,
      metadata: row.metadataJSON
        ? safeParse(row.metadataJSON, z.any(), null)
        : undefined,
      reactions: safeParse(row.reactionsJSON, chatReactionsShape, {}),
    };
  };
  async getChatForPlayer(
    playerId: PrefixedId<'u'>,
    {
      pagination,
      filter,
    }: {
      pagination?: {
        limit: number;
        nextToken?: string | null;
      };
      filter?: {
        sceneId?: string | null;
      };
    },
  ) {
    const { limit = 100, nextToken } = pagination ?? {};
    if (limit > 100) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Limit must be less than or equal to 100',
      );
    }
    const before = nextToken ? this.#decodeChatPageToken(nextToken) : null;
    const gameStatus = await this.getStatus();
    const gameIsOver = gameStatus.status === 'complete';
    let sql = db
      .selectFrom('ChatMessage')
      .selectAll()
      .orderBy('ChatMessage.createdAt', 'desc')
      .limit(limit + 1)
      .where((wb) =>
        wb.or([
          wb('ChatMessage.recipientIdsList', 'is', null),
          wb('ChatMessage.recipientIdsList', 'like', `%,${playerId},%`),
        ]),
      );

    if (before) {
      sql = sql.where('ChatMessage.createdAt', '<', before);
    }
    if (filter?.sceneId) {
      sql = sql.where('ChatMessage.sceneId', '=', filter.sceneId);
    } else {
      sql = sql.where('ChatMessage.sceneId', 'is', null);
    }
    if (!gameIsOver) {
      sql = sql
        .where('ChatMessage.roundIndex', '>=', 0)
        .where(
          'ChatMessage.roundIndex',
          '<=',
          await this.getCurrentRoundIndex(),
        );
    }
    const result = await this.#sql.run(sql);
    const messages = result.reverse().map((row) => {
      return this.#hydrateChatMessage(row);
    });
    const nextPageToken =
      messages.length === limit + 1
        ? this.#encodeChatPageToken(messages[0].createdAt)
        : null;
    if (nextPageToken) {
      messages.pop();
    }
    return {
      messages,
      nextToken: nextPageToken,
    };
  }
  async toggleChatReaction(
    playerId: PrefixedId<'u'>,
    messageId: PrefixedId<'cm'>,
    reaction: string,
    on: boolean,
  ) {
    const message = (
      await this.#sql.run(
        db
          .selectFrom('ChatMessage')
          .select('reactionsJSON')
          .where('id', '=', messageId),
      )
    )[0];
    if (!message) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        `Chat message ${messageId} not found`,
      );
    }
    const parsedReactions = safeParse(
      message.reactionsJSON,
      chatReactionsShape,
      {},
    );
    const currentValue = new Set(parsedReactions[reaction] ?? []);
    if (on) {
      currentValue.add(playerId);
    } else {
      currentValue.delete(playerId);
    }
    const newReactions = {
      ...parsedReactions,
      [reaction]: Array.from(currentValue),
    };
    this.log(
      'debug',
      `Setting reaction ${reaction} for player ${playerId} on message ${messageId}`,
      newReactions,
    );
    // be sure...
    if (chatReactionsShape.safeParse(newReactions).success === false) {
      this.log('error', `Unexpected reaction data: ${newReactions}`);
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Unexpected error when applying reaction',
      );
    }
    const updated = await this.#sql.run(
      db
        .updateTable('ChatMessage')
        .set({
          reactionsJSON: JSON.stringify(newReactions),
        })
        .where('id', '=', messageId)
        .returningAll(),
    );
    // send the updated message to all players
    await this.#socketHandler.send({
      type: 'chat',
      messages: updated.map(this.#hydrateChatMessage),
      sceneId: updated[0].sceneId ?? null,
    });
  }

  // private state
  async #updateStatus(status: 'pending' | 'active' | 'complete' | 'abandoned') {
    const currentData = await this.#getSessionData();
    if (status === 'active') {
      if (!currentData.startedAt) {
        await this.#updateSessionData({
          startedAt: new Date().toISOString(),
        });
      }
    } else if (status === 'complete' || status === 'abandoned') {
      if (!currentData.endedAt) {
        await this.#updateSessionData({
          endedAt: new Date().toISOString(),
          abandonedAt: status === 'abandoned' ? new Date().toISOString() : null,
        });

        if (status === 'abandoned') {
          // notify all players that the game was abandoned
          const members = await this.getMembers();
          for (const member of members) {
            await notifyUser(
              member.id,
              {
                type: 'game-abandoned',
                gameSessionId: currentData.id,
                id: id('no'),
              },
              this.env,
            );
          }
        }
      }
    }
    // this updates in local state, but also writes to the entry in D1 for this session,
    // so that external aggregate queries can filter on status
    await this.env.ADMIN_STORE.updateGameSession(currentData.id, {
      status,
    });

    this.#socketHandler.send({
      type: 'statusChange',
      status: await this.getStatus(),
    });
  }
  async #getRoundsUnchecked({
    upToAndIncluding,
  }: {
    /**
     * Inclusive upper bound for rounds to return.
     * Pass getCurrentRoundIndex() for everything.
     */
    upToAndIncluding: number;
  }): Promise<GameRound<GameSessionTurn>[]> {
    const turns = await this.#listTurns({ roundLte: upToAndIncluding });
    return groupTurnsToRounds(turns);
  }
  async #getGlobalStateUnchecked(
    upToAndIncludingRoundIndex?: number,
  ): Promise<{}> {
    const roundIndex =
      upToAndIncludingRoundIndex ?? (await this.getCurrentRoundIndex());
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: roundIndex,
    });
    const cache = await this.#getStateCache();
    return cache.getState(rounds);
  }
  async #getPlayerStateUnchecked(
    playerId: PrefixedId<'u'>,
    upToAndIncludingRoundIndex?: number,
  ): Promise<unknown> {
    // cannot compute player state before game has started - this results in errors
    // since game logic depends on setup being correct, like # of players, etc.
    if (!(await this.getHasGameStarted())) {
      // TODO: throw?
      return {};
    }

    const resolvedRoundIndex =
      upToAndIncludingRoundIndex ?? (await this.getPublicRoundIndex());
    const globalState = await this.#getGlobalStateUnchecked(resolvedRoundIndex);
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: resolvedRoundIndex,
    });
    const playerTurn =
      rounds[resolvedRoundIndex]?.turns.find((t) => t.playerId === playerId) ||
      null;
    const gameDefinition = await this.getGameDefinition();
    const members = await this.getMembers();
    return gameDefinition.getPlayerState({
      globalState,
      playerId,
      members,
      roundIndex: rounds.length,
      rounds,
      playerTurn,
    }) as unknown;
  }
  async #getRound(roundIndex: number): Promise<GameRound<GameSessionTurn>> {
    const turns = await this.#listTurns({ roundIndex });
    const round = turns.filter((t) => t.roundIndex === roundIndex);
    return {
      roundIndex,
      turns: round,
    };
  }
  async #getCurrentRoundState(): Promise<RoundIndexResult> {
    const sessionData = await this.#getSessionData();
    if (!sessionData.startedAt) {
      return {
        roundIndex: 0,
        pendingTurns: [],
      };
    }
    const turns = await this.#listTurns();
    const latestRoundFromTurns = Math.max(0, ...turns.map((t) => t.roundIndex));
    const gameDefinition = await this.getGameDefinition();
    const members = await this.getMembers();
    const currentTime = new Date();
    const startedAt = new Date(sessionData.startedAt);
    const gameTimeZone = sessionData.timezone;
    // TODO: we already have turns in scope, we could compute this without
    // dipping back.
    const globalState =
      await this.#getGlobalStateUnchecked(latestRoundFromTurns);
    return gameDefinition.getRoundIndex({
      turns,
      members,
      startedAt,
      currentTime,
      gameTimeZone,
      globalState,
      environment: this.env.DEV_MODE ? 'development' : 'production',
    });
  }

  // Turn changes
  async #insertTurn(turn: GameSessionTurn): Promise<GameSessionTurn> {
    const turnId: PrefixedId<'t'> = `t-${turn.playerId}:${turn.roundIndex}`;
    const values = {
      id: turnId,
      createdAt: turn.createdAt,
      data: JSON.stringify(turn.data),
      roundIndex: turn.roundIndex,
      playerId: turn.playerId,
    };
    const sql = db
      .insertInto('Turn')
      .values(values)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          createdAt: turn.createdAt,
          data: JSON.stringify(turn.data),
        }),
      );
    await this.#sql.run(sql);
    return values;
  }
  #applyTurn = async (
    data: BaseTurnData,
    playerId: PrefixedId<'u'>,
    currentRoundIndex: number,
  ) => {
    const newTurn = {
      roundIndex: currentRoundIndex,
      createdAt: new Date().toISOString(),
      data,
      playerId,
    };
    await this.#insertTurn(newTurn);
    // send turn played notification to all players except the one who played
    await this.#socketHandler.send(
      {
        type: 'turnPlayed',
        roundIndex: currentRoundIndex,
        turn: {
          playerId,
          // data for active round is not sent to players
          data: null,
        },
      },
      {
        notTo: [playerId],
      },
    );
    // for the player who played the turn, send the message with the turn data,
    // since that will sync up their devices.
    await this.#socketHandler.send(
      {
        type: 'turnPlayed',
        roundIndex: currentRoundIndex,
        turn: {
          playerId,
          data: newTurn.data,
        },
      },
      {
        to: [playerId],
      },
    );
  };

  // Player notifications
  async #markPlayerNotified(playerId: PrefixedId<'u'>) {
    const state = await this.#getRoundState();
    state.playersNotified[playerId] = new Date().toISOString();
    await this.#setRoundState(state);
  }

  async #notifyPlayerOfTurn(playerId: PrefixedId<'u'>) {
    const sessionData = await this.#getSessionData();
    if (!sessionData.gameId || !sessionData.gameVersion) {
      this.log('warn', `No game in progress; cannot notify player of turn`);
      return;
    }
    const scheduler = await getNotificationScheduler(playerId, this.env);
    const game = games[sessionData.gameId];
    await scheduler.add(playerId, {
      type: 'turn-ready',
      turns: [
        {
          gameId: sessionData.gameId,
          gameSessionId: sessionData.id,
          gameTitle: game?.title ?? 'a game',
        },
      ],
      id: id('no'),
    });
  }

  /**
   * Call after material changes are made to the game
   * state. This will recompute the round and send or
   * schedule notifications to players.
   */
  #checkForRoundChange = async () => {
    const roundState = await this.#getCurrentRoundState();
    this.log('debug', `Round state: ${JSON.stringify(roundState)}`);
    let notifications = await this.#getRoundState();
    if (roundState.roundIndex !== notifications.roundIndex) {
      // round index is out of date, reset
      notifications = await this.#setRoundState({
        roundIndex: roundState.roundIndex,
        playersNotified: {},
      });
      // check if the game is over
      const status = await this.getStatus();
      if (status.status === 'complete') {
        await this.#updateStatus('complete');
        // apply winners
        const id = await this.getId();
        await this.env.ADMIN_STORE.updateGameSession(id, {
          winnerIdsJson: status.winnerIds,
        });
        this.#sendGameRoundChangeMessages(roundState.roundIndex);
      } else {
        // notify players of round change
        this.#socketHandler.send({
          type: 'roundChange',
          newRoundIndex: roundState.roundIndex,
          playerStatuses: await this.getPlayerStatuses(),
        });
        this.#sendGameRoundChangeMessages(roundState.roundIndex);
      }
    }
    for (const playerId of roundState.pendingTurns) {
      if (!notifications.playersNotified[playerId]) {
        try {
          // schedule a notification for this player
          await this.#notifyPlayerOfTurn(playerId);
          await this.#markPlayerNotified(playerId);
        } catch (err) {
          this.log(
            'error',
            `Failed to send player notification to ${playerId}`,
            err,
          );
        }
      } else {
        this.log(
          'debug',
          `Player ${playerId} already notified of turn, skipping`,
        );
      }
    }
    if (roundState.checkAgainAt) {
      this.log('debug', `Scheduling check again at ${roundState.checkAgainAt}`);
      this.#scheduler.scheduleTask(roundState.checkAgainAt, {
        type: 'checkRound',
      });
      this.#socketHandler.send({
        type: 'nextRoundScheduled',
        nextRoundCheckAt: roundState.checkAgainAt.toISOString(),
      });
    }
    if (roundState.pendingTurns.length > 0) {
      this.#scheduleTurnRemindersTask();
    }
  };
  #sendGameRoundChangeMessages = async (roundIndex: number) => {
    // if game definition has a round change message, add it to chat
    const gameDefinition = await this.getGameDefinition();
    if (gameDefinition.getRoundChangeMessages) {
      // FIXME: redundant global state calculation with rounds
      const globalState = await this.#getGlobalStateUnchecked(roundIndex);
      const rounds = await this.#getRoundsUnchecked({
        upToAndIncluding: roundIndex,
      });
      const members = await this.getMembers();
      const roundChangeMessages = gameDefinition.getRoundChangeMessages({
        globalState,
        roundIndex: roundIndex,
        members,
        rounds,
        newRound: rounds[roundIndex],
        completedRound: roundIndex > 0 ? rounds[roundIndex - 1] : null,
      });
      if (roundChangeMessages) {
        // not Promise.all because we want to keep intended ordering
        for (const message of roundChangeMessages) {
          await this.addChatMessage({
            ...message,
            id: id('cm'),
            createdAt: new Date().toISOString(),
            authorId: SYSTEM_CHAT_AUTHOR_ID,
            roundIndex: roundIndex,
            reactions: {},
          });
        }
      }
    }
  };
  #scheduleTurnRemindersTask = () => {
    // schedule a follow up for 7 AM the next day to remind players
    // TODO: timezone! agh!
    const sevenAm = setHours(startOfDay(addDays(new Date(), 1)), 7);
    this.log(
      'debug',
      `Scheduling turn reminders for ${sevenAm.toISOString()} (next day at 7 AM)`,
    );
    return this.#scheduler.scheduleTask(
      sevenAm,
      { type: 'turnReminders' },
      'turn-reminders',
    );
  };
  #sendTurnReminders = async () => {
    this.log('debug', `Sending turn reminders to players`);
    const roundState = await this.#getCurrentRoundState();
    for (const playerId of roundState.pendingTurns) {
      try {
        await this.#notifyPlayerOfTurn(playerId);
      } catch (err) {
        this.log('error', `Failed to send turn reminder to ${playerId}`, err);
      }
    }
    if (roundState.pendingTurns.length > 0) {
      this.#scheduleTurnRemindersTask();
    }
  };

  async alarm() {
    this.#scheduler.handleAlarm();
  }
  private handleScheduledTask = async (task: ScheduledTasks) => {
    this.log('debug', `Handling scheduled task: ${task.type}`);
    switch (task.type) {
      case 'checkRound':
        return this.#checkForRoundChange();
      case 'startGame':
        if (await this.getAllPlayersReady()) {
          return this.startGame();
        }
      case 'turnReminders':
        return this.#sendTurnReminders();
    }
  };

  // debug / admin
  async dumpDb() {
    const turns = await this.#sql.run(db.selectFrom('Turn').selectAll());
    const chatMessages = await this.#sql.run(
      db.selectFrom('ChatMessage').selectAll(),
    );
    const sessionData = await this.#getSessionData();
    const roundState = await this.#getRoundState();
    let globalState: {} = {};
    try {
      globalState = await this.#getGlobalStateUnchecked();
    } catch (err) {
      globalState = {
        error: `Failed to get global state: ${(err as Error).message}`,
      };
    }
    return {
      turns,
      chatMessages,
      sessionData,
      roundState,
      globalState,
    };
  }
}
