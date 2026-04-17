import {
  chatPositionShape,
  chatReactionsShape,
  chatTokens,
  deduplicatePlayerColors,
  GameRound,
  gameSessionChatMessageShape,
  GameSessionPlayerStatus,
  GameStatus,
  groupTurnsToRounds,
  id,
  LongGameError,
  PrefixedId,
  safeParse,
  safeParseMaybe,
  SYSTEM_CHAT_AUTHOR_ID,
  withTimezone,
} from '@long-game/common';
import { GameApiClient, StateCache } from '@long-game/game-api/client';
import {
  BaseTurnData,
  GameMember,
  getLatestVersion,
  getVersion,
  RoundIndexResult,
  Turn,
} from '@long-game/game-definition';
import { getGame } from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { addDays, addWeeks, startOfDay } from 'date-fns';
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
  expiredAt?: string | null;
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
      type: 'turnReminders';
    }
  | {
      type: 'joinReminders';
    }
  | {
      type: 'readyReminders';
    }
  | {
      type: 'sessionExpiry';
    };
const sessionExpiryTaskId = 'session-expiry';

export class GameSession extends DurableObject<ApiBindings> {
  #sql: SqlWrapper;
  #socketHandler: GameSessionSocketHandler;
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

  async fetch(req: Request) {
    // socket delegation
    if (req.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      return this.#socketHandler.fetch(req);
    }

    const path = new URL(req.url).pathname;
    if (path === '/dump') {
      const dump = await this.dumpDb();
      const res = new Response(JSON.stringify(dump, null, 2));
      res.headers.set('Content-Type', 'application/json');
      res.headers.set(
        'Content-Disposition',
        `attachment; filename="${this.#cachedGameSessionId ?? 'session'}.json"`,
      );
      return res;
    }

    return new Response('Not found', { status: 404 });
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
    this.#cachedGameSessionId = data.id;
    return data;
  }
  async #hasSessionData(): Promise<boolean> {
    const data = await this.#maybeGetSessionData();
    return Boolean(data);
  }
  async #setSessionData(data: GameSessionBaseData) {
    await this.ctx.storage.put('sessionData', data);
    this.#cachedGameSessionId = data.id;
    // invalidate client -- if members or random seed change,
    // it's no longer valid and must be recomputed
    this.#invalidateGame();
    return data;
  }
  async #updateSessionData(updates: Partial<GameSessionBaseData>) {
    const data = await this.#getSessionData();
    return this.#setSessionData({ ...data, ...updates });
  }
  async #getNotificationState(): Promise<GameSessionRoundState> {
    return (
      (await this.ctx.storage.get('notifications')) || {
        playersNotified: {},
        roundIndex: -1,
      }
    );
  }
  async #setNotificationState(notifications: GameSessionRoundState) {
    await this.ctx.storage.put('notifications', notifications);
    return notifications;
  }
  /**
   * When round state is computed, we cache which players still need to
   * play their turn so we don't have to round trip back to recalculate to
   * show this on the homescreen.
   */
  async #getCachedPendingTurns(): Promise<PrefixedId<'u'>[] | null> {
    return (await this.ctx.storage.get('pendingTurns')) || null;
  }
  async #setCachedPendingTurns(pendingTurns: PrefixedId<'u'>[] | null) {
    await this.ctx.storage.put('pendingTurns', pendingTurns);
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
    } else if (status === 'pending') {
      await this.#scheduleJoinRemindersTask();
      // Only schedule expiry if not already scheduled (don't reset the clock on restart)
      if (!(await this.#scheduler.hasTask(sessionExpiryTaskId))) {
        await this.#scheduleSessionExpiryTask();
      }
    }

    // temporary: repair mixed up alias IDs
    const data = await this.#maybeGetSessionData();
    if (data?.gameId) {
      const game = getGame(data.gameId);
      if (game.id !== data.gameId) {
        this.log('info', `Repairing mixed up game ID for session ${data.id}`);
        // repair mixed up alias IDs
        await this.#updateSessionData({ gameId: game.id });
      }
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
  async getCreatorId(): Promise<PrefixedId<'u'> | undefined> {
    return (await this.#getSessionData()).createdBy;
  }
  async getHasGameStarted(): Promise<boolean> {
    const sessionData = await this.#getSessionData();
    return Boolean(sessionData.startedAt);
  }
  async getGameModule() {
    const { gameId } = await this.#getSessionData();
    if (!gameId) {
      return null;
    }

    return getGame(gameId);
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
      await this.updateGame(gameId, getLatestVersion(getGame(gameId)).version);
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

    // add a chat message about the vote
    await this.addChatMessage({
      id: id('cm'),
      authorId: playerId,
      content: `Let's play ${chatTokens.gameTitle(gameId)}!`,
      createdAt: new Date().toISOString(),
      metadata: {
        gameId,
      },
      type: 'game-vote',
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

  #gameApiClient: GameApiClient | null = null;
  #stateCheckpointCache: StateCache = {
    has: async (roundIndex) => {
      return (
        (await this.ctx.storage.get(`stateCheckpoint/${roundIndex}`)) !==
        undefined
      );
    },
    get: async (roundIndex) => {
      return (
        (await this.ctx.storage.get(`stateCheckpoint/${roundIndex}`)) || null
      );
    },
    set: async (roundIndex, checkpoint) => {
      return this.ctx.storage.put(`stateCheckpoint/${roundIndex}`, checkpoint);
    },
  };

  async #getGameApi(): Promise<GameApiClient> {
    if (this.#gameApiClient) return this.#gameApiClient;
    const sessionData = await this.#getSessionData();
    if (!sessionData.gameId || !sessionData.gameVersion) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot get game API before game is selected',
      );
    }
    const gameManifest = getGame(sessionData.gameId);
    const gameVersion = getVersion(gameManifest, sessionData.gameVersion);
    if (!gameVersion) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Cannot get game API for unknown game version ${sessionData.gameVersion} of ${sessionData.gameId}`,
      );
    }
    this.#gameApiClient = new GameApiClient({
      gameId: sessionData.gameId,
      version: sessionData.gameVersion,
      fetch: this.env.GAME_REGISTRY.fetch.bind(this.env.GAME_REGISTRY),
      isDev: !!this.env.DEV_MODE,
      members: await this.getMembers(),
      randomSeed: sessionData.randomSeed,
      sessionId: sessionData.id,
      setupData: await this.#getSetupData(),
      timeZone: sessionData.timezone,
      stateCache: this.#stateCheckpointCache,
    });
    return this.#gameApiClient;
  }

  #invalidateGame() {
    this.#gameApiClient = null;
  }

  async delete() {
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
    // Schedule expiry for 1 week from now
    await this.#scheduleSessionExpiryTask();
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
    } else {
      // Refresh the expiry schedule whenever members change while game is pending
      // (e.g., when a new member accepts an invite)
      await this.#scheduleSessionExpiryTask();
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
    const gameModule = getGame(sessionData.gameId);
    // update to latest version of chosen game
    const gameDefinition = getLatestVersion(gameModule);
    await this.updateGame(sessionData.gameId, gameDefinition.version);

    const client = await this.#getGameApi();
    const details = await client.getDetails();

    // validate player count
    const members = await this.getMembers();
    if (
      members.length < details.minimumPlayers ||
      members.length > details.maximumPlayers
    ) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Player count must be between ${details.minimumPlayers} and ${details.maximumPlayers}`,
      );
    }

    // lock in setup data, if available
    const setupData = await client.generateSetupData();
    await this.#setSetupData(setupData);

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
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: roundIndex,
    });
    const initialPlayerState: any = await this.#getPlayerStateUnchecked(
      playerId,
      roundIndex - 1,
    );
    const client = await this.#getGameApi();
    const publicTurns = await client.computePublicTurns({
      turns: round.turns,
      rounds,
    });

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
        return publicTurns[turn.playerId];
      }),
    };
  }
  // users can get global state in dev mode or after game has ended
  async getGlobalState(): Promise<{}> {
    const status = await this.getStatus();
    if (
      status.status !== 'complete' &&
      status.status !== 'abandoned' &&
      !this.env.DEV_MODE
    ) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Cannot get global state until game is over. Game status is currently ${status.status}.`,
      );
    }
    return await this.#getGlobalStateUnchecked();
  }
  async #getPendingTurnsCachedOrCompute(): Promise<PrefixedId<'u'>[]> {
    let pendingTurns = await this.#getCachedPendingTurns();
    if (!pendingTurns) {
      const roundState = await this.#getCurrentRoundState();
      pendingTurns = roundState.pendingTurns;
      await this.#setCachedPendingTurns(pendingTurns);
    }
    return pendingTurns || [];
  }
  async getPlayerStatuses(): Promise<
    Record<PrefixedId<'u'>, GameSessionPlayerStatus>
  > {
    const members = await this.getMembers();
    const pendingTurns = await this.#getPendingTurnsCachedOrCompute();
    const statuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus> = {};
    for (const member of members) {
      statuses[member.id] = {
        online: await this.presence.getIsOnline(member.id),
        pendingTurn: pendingTurns.includes(member.id),
      };
    }
    return statuses;
  }
  async getPlayerIsPendingTurn(playerId: PrefixedId<'u'>) {
    const pendingTurns = await this.#getPendingTurnsCachedOrCompute();
    return pendingTurns.includes(playerId);
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

    const currentRoundIndex = await this.getCurrentRoundIndex();
    // when validating we apply the turn to the last settled round, not the
    // live current round. this is important... if not, the bug looks like
    // the game trying to validate against the next round, i.e. errors like
    // "you don't have that card in your hand" etc.
    const latestSettledRoundIndex = currentRoundIndex - 1;
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: latestSettledRoundIndex,
    });

    const client = await this.#getGameApi();

    const validationResult = await client.validateTurn({
      turn: {
        data: turn,
        playerId,
        roundIndex: latestSettledRoundIndex,
      },
      rounds,
    });

    if (validationResult.message) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        validationResult.message,
      );
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
      if (sessionData.expiredAt) {
        return { status: 'expired' };
      }
      return { status: 'pending' };
    }
    if (sessionData.abandonedAt) {
      return { status: 'abandoned' };
    }

    // !!! Not sure if current or public is the right one here... but public
    // was causing games not to complete, I guess it was getting stuck at the last round?
    const currentRoundIndex = await this.getCurrentRoundIndex();
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: currentRoundIndex,
    });
    const client = await this.#getGameApi();
    const statusResult = await client.computeStatus({
      rounds,
    });
    return statusResult;
  }

  async getDetails() {
    const sessionData = await this.#getSessionData();
    const roundData = await this.#getCurrentRoundState();
    const status = await this.getStatus();
    const members = await this.getMembers();
    const playerStatuses = await this.getPlayerStatuses();
    const gameVotes = await this.getGameVotes();
    return {
      id: sessionData.id,
      status,
      gameId: sessionData.gameId,
      gameVersion: sessionData.gameVersion,
      members,
      startedAt: sessionData.startedAt,
      timezone: sessionData.timezone,
      endedAt: sessionData.endedAt,
      nextRoundCheckAt: roundData.checkAgainAt ?? null,
      currentRoundIndex: roundData.roundIndex,
      playerStatuses,
      createdBy: sessionData.createdBy ?? null,
      gameVotes,
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
    await this.#setNotificationState({
      roundIndex: -1,
      playersNotified: {},
    });
    await this.#checkForRoundChange();
    this.#socketHandler.send({
      type: 'gameChange',
    });
  }
  async updateTimezone(timezone: string) {
    await this.#updateSessionData({ timezone });
    await this.#checkForRoundChange();
    await this.#scheduleTurnRemindersTask();
  }
  async setLeader(leaderId: PrefixedId<'u'>) {
    const members = await this.getMembers();
    if (!members.find((m) => m.id === leaderId)) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Leader must be a member of the game session',
      );
    }
    await this.#updateSessionData({ createdBy: leaderId });
    await this.#checkForRoundChange();
  }

  // chat
  async addChatMessage(input: z.input<typeof gameSessionChatMessageShape>) {
    const message = gameSessionChatMessageShape.parse(input);
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
        type: message.type,
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
    const timeOrderedMessages = result.reverse().map((row) => {
      return this.#hydrateChatMessage(row);
    });
    const nextPageToken =
      timeOrderedMessages.length === limit + 1
        ? this.#encodeChatPageToken(timeOrderedMessages[0].createdAt)
        : null;
    if (nextPageToken) {
      timeOrderedMessages.pop();
    }
    // -1 round index should show up after the game ends - we order these messages
    // in a separate group at the end
    const endgameMessages = timeOrderedMessages.filter(
      (m) => m.roundIndex === -1,
    );
    const otherMessages = timeOrderedMessages.filter(
      (m) => m.roundIndex !== -1,
    );
    const finalMessages = [...otherMessages, ...endgameMessages];
    return {
      messages: finalMessages,
      nextToken: nextPageToken,
    };
  }

  async #getAllChatMessages() {
    const result = await this.#sql.run(
      db.selectFrom('ChatMessage').selectAll().orderBy('createdAt', 'asc'),
    );
    return result.map(this.#hydrateChatMessage);
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
  async #updateStatus(
    status: 'pending' | 'active' | 'complete' | 'abandoned' | 'expired',
  ) {
    const currentData = await this.#getSessionData();
    if (status === 'active') {
      if (!currentData.startedAt) {
        await this.#updateSessionData({
          startedAt: new Date().toISOString(),
        });
      }
      // Cancel expiry when game becomes active
      await this.#scheduler.cancelTask(sessionExpiryTaskId);
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
      // Cancel expiry when game ends
      await this.#scheduler.cancelTask(sessionExpiryTaskId);
    } else if (status === 'expired') {
      if (!currentData.expiredAt) {
        await this.#updateSessionData({
          expiredAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        });
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
    const client = await this.#getGameApi();
    return client.computeGlobalState(rounds);
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
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: resolvedRoundIndex,
    });
    const playerTurn =
      rounds[resolvedRoundIndex]?.turns.find((t) => t.playerId === playerId) ||
      null;
    const client = await this.#getGameApi();
    return client.computePlayerState({
      playerId,
      playerTurn,
      rounds,
    });
  }
  async #getRound(roundIndex: number): Promise<GameRound<GameSessionTurn>> {
    const turns = await this.#listTurns({ roundIndex });
    const round = turns.filter((t) => t.roundIndex === roundIndex);
    return {
      roundIndex,
      turns: round,
    };
  }
  async #getCurrentRoundState(): Promise<
    Omit<RoundIndexResult, 'checkAgainAt'> & { checkAgainAt?: string | null }
  > {
    const sessionData = await this.#getSessionData();
    if (!sessionData.startedAt) {
      return {
        roundIndex: 0,
        pendingTurns: [],
      };
    }
    const turns = await this.#listTurns();
    const client = await this.#getGameApi();
    const result = await client.computeRoundIndex({
      turns,
      startedAt: sessionData.startedAt,
    });
    this.#setCachedPendingTurns(result.pendingTurns);
    return result;
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
    // invalidate cached pending turns
    this.#setCachedPendingTurns(null);
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

  // TODO: clear up what 'notified' means in context - this does not refer to
  // turn reminders, just notifications during the initial change of rounds...
  async #markPlayerNotified(playerId: PrefixedId<'u'>) {
    const state = await this.#getNotificationState();
    state.playersNotified[playerId] = new Date().toISOString();
    await this.#setNotificationState(state);
  }

  async #notifyPlayerOfTurn(playerId: PrefixedId<'u'>) {
    const sessionData = await this.#getSessionData();
    if (!sessionData.gameId || !sessionData.gameVersion) {
      this.log('warn', `No game in progress; cannot notify player of turn`);
      return;
    }
    const scheduler = await getNotificationScheduler(playerId, this.env);
    const game = getGame(sessionData.gameId);
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
    let notifications = await this.#getNotificationState();
    if (roundState.roundIndex !== notifications.roundIndex) {
      // round index is out of date, reset
      notifications = await this.#setNotificationState({
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
      this.#scheduler.scheduleTask(new Date(roundState.checkAgainAt), {
        type: 'checkRound',
      });
      this.#socketHandler.send({
        type: 'nextRoundScheduled',
        nextRoundCheckAt: roundState.checkAgainAt,
      });
    }
    if (roundState.pendingTurns.length > 0) {
      await this.#scheduleTurnRemindersTask();
    }
  };
  #sendGameRoundChangeMessages = async (roundIndex: number) => {
    const client = await this.#getGameApi();
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: roundIndex,
    });
    const messages = await client.computeRoundChangeMessages({
      rounds,
      roundIndex,
    });
    if (messages) {
      // not Promise.all because we want to keep intended ordering
      for (const message of messages) {
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
  };

  #turnRemindersTaskId = 'turn-reminders';
  #scheduleTurnRemindersTask = async () => {
    const hasScheduledTask = await this.#scheduler.hasTask(
      this.#turnRemindersTaskId,
    );
    if (hasScheduledTask) {
      this.log('debug', `Turn reminders task already scheduled, skipping`);
      return;
    }

    // schedule a follow up for 7 AM the next day to remind players
    // according to the specified timezone
    const gameData = await this.#getSessionData();
    const timezone = gameData.timezone || 'UTC';
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const sevenAm = withTimezone(
      {
        year: tomorrow.getUTCFullYear(),
        month: tomorrow.getUTCMonth(),
        date: tomorrow.getUTCDate(),
        hour: 7,
        minute: 0,
        second: 0,
      },
      timezone,
    );
    this.log(
      'debug',
      `Scheduling turn reminders for ${sevenAm.toISOString()} (next day at 7 AM)`,
    );
    return this.#scheduler.scheduleTask(
      sevenAm,
      { type: 'turnReminders' },
      this.#turnRemindersTaskId,
    );
  };
  #sendTurnReminders = async () => {
    const status = await this.getStatus();

    if (status.status !== 'active') {
      this.log('debug', `Game is not active, skipping turn reminders`);
      return;
    }
    this.log('debug', `Sending turn reminders to players`);
    const roundState = await this.#getCurrentRoundState();
    for (const playerId of roundState.pendingTurns) {
      // if player is online now, don't send notification.
      if (await this.presence.getIsOnline(playerId)) {
        this.log(
          'debug',
          `Player ${playerId} is online, skipping turn reminder notification`,
        );
        continue;
      }

      try {
        await this.#notifyPlayerOfTurn(playerId);
      } catch (err) {
        this.log('error', `Failed to send turn reminder to ${playerId}`, err);
      }
    }
    if (roundState.pendingTurns.length > 0) {
      await this.#scheduleTurnRemindersTask();
    }
  };

  #scheduleJoinRemindersTask = async () => {
    const hasScheduledTask = await this.#scheduler.hasTask('invite-reminders');
    if (hasScheduledTask) {
      this.log('debug', `Invite reminders task already scheduled, skipping`);
      return;
    }
    // schedule a follow up for 8 AM the next day (in the session timezone) to
    // remind players to join. Repeats daily until the game session is no longer pending.
    const sessionData = await this.#maybeGetSessionData();
    if (!sessionData) {
      this.log(
        'debug',
        'No session data yet, skipping join reminder scheduling',
      );
      return;
    }
    const timezone = sessionData.timezone || 'UTC';
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const eightAm = withTimezone(
      {
        year: tomorrow.getUTCFullYear(),
        month: tomorrow.getUTCMonth(),
        date: tomorrow.getUTCDate(),
        hour: 8,
        minute: 0,
        second: 0,
      },
      timezone,
    );
    this.log(
      'debug',
      `Scheduling join reminders for ${eightAm.toISOString()} (next day at 8 AM)`,
    );
    return this.#scheduler.scheduleTask(
      eightAm,
      { type: 'joinReminders' },
      'invite-reminders',
    );
  };
  #sendJoinReminders = async () => {
    const status = await this.getStatus();
    if (status.status !== 'pending') {
      this.log('debug', `Game is not pending, skipping join reminders`);
      return;
    }
    const sessionData = await this.#getSessionData();
    const sessionId = sessionData.id;
    const gameTitle = (await this.getGameModule())?.title;
    const leaderId = sessionData.createdBy;
    if (!leaderId) {
      this.log('debug', `No game leader found, skipping join reminders`);
      return;
    }
    // Get the actual expiry time from the scheduled task if available
    const scheduledExpiresAt =
      await this.#scheduler.getTaskScheduledAt(sessionExpiryTaskId);
    const expiresAt =
      scheduledExpiresAt ?? addWeeks(new Date(sessionData.createdAt), 1);

    // Send start reminder to the game leader
    this.log('debug', `Sending start reminder to game leader ${leaderId}`);
    try {
      await notifyUser(
        leaderId,
        {
          type: 'game-start-reminder',
          gameSessionId: sessionId,
          id: id('no'),
          createdAt: sessionData.createdAt,
          gameTitle,
          expiresAt: expiresAt.toISOString(),
        },
        this.env,
      );
    } catch (err) {
      this.log(
        'error',
        `Failed to send start reminder to leader ${leaderId}`,
        err,
      );
    }

    // Send invite reminders to any pending invitees who haven't joined yet
    const pendingInvites = await this.env.ADMIN_STORE.getInvitedPlayerIds(
      sessionId,
      { statusFilter: 'pending' },
    );
    this.log(
      'debug',
      `Sending invite reminders to ${pendingInvites.length} pending invitees`,
    );
    for (const invite of pendingInvites) {
      try {
        await notifyUser(
          invite.userId,
          {
            type: 'game-invite-reminder',
            gameSessionId: sessionId,
            id: id('no'),
            invitedAt: invite.createdAt,
            gameTitle,
          },
          this.env,
        );
      } catch (err) {
        this.log(
          'error',
          `Failed to send invite reminder to invitee ${invite.userId}`,
          err,
        );
      }
    }

    // reschedule for 8 AM tomorrow to keep reminding until the game starts
    await this.#scheduleJoinRemindersTask();
  };

  #scheduleSessionExpiryTask = async () => {
    const expiresAt = addWeeks(new Date(), 1);
    this.log(
      'debug',
      `Scheduling session expiry for ${expiresAt.toISOString()} (1 week from now)`,
    );
    return this.#scheduler.scheduleTask(
      expiresAt,
      { type: 'sessionExpiry' },
      sessionExpiryTaskId,
    );
  };
  #expireSession = async () => {
    const status = await this.getStatus();
    if (status.status !== 'pending') {
      this.log(
        'debug',
        `Game is not pending (status: ${status.status}), skipping expiry`,
      );
      return;
    }
    this.log('debug', `Expiring game session`);
    await this.#updateStatus('expired');
  };

  async alarm() {
    this.#scheduler.handleAlarm();
  }
  private handleScheduledTask = async (task: ScheduledTasks) => {
    this.log('debug', `Handling scheduled task: ${task.type}`);
    switch (task.type) {
      case 'checkRound':
        return this.#checkForRoundChange();
      case 'turnReminders':
        return this.#sendTurnReminders();
      case 'joinReminders':
        return this.#sendJoinReminders();
      case 'sessionExpiry':
        return this.#expireSession();
      default:
        this.log('error', `Unknown scheduled task type: ${(task as any).type}`);
    }
  };

  // debug / admin
  async dumpDb() {
    const turns = await this.#sql.run(db.selectFrom('Turn').selectAll());
    const chatMessages = await this.#sql.run(
      db.selectFrom('ChatMessage').selectAll(),
    );
    const sessionData = await this.#getSessionData();
    const roundState = await this.#getNotificationState();
    const setupData = await this.#getSetupData();
    let globalState: {} = {};
    try {
      globalState = await this.#getGlobalStateUnchecked();
    } catch (err) {
      globalState = {
        error: `Failed to get global state: ${(err as Error).message}`,
      };
    }
    const status = await this.getStatus();
    return {
      turns,
      chatMessages,
      sessionData,
      roundState,
      globalState,
      status,
      setupData,
    };
  }

  /**
   * Used for analytics and survey feedback on games.
   * Provides all the data needed to replay the game session
   * without linking to the actual identities of players.
   */
  async getAnonymizedSummary() {
    const sessionData = await this.#getSessionData();
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: await this.getCurrentRoundIndex(),
    });
    const members = await this.getMembers();
    const setupData = await this.#getSetupData();
    const chat = await this.#getAllChatMessages();

    const anonymizedPlayerIdMap = members.reduce(
      (acc, member, index) => {
        acc[member.id] = `player${index + 1}`;
        return acc;
      },
      {} as Record<PrefixedId<'u'>, string>,
    );
    const anonymizedMembers = members.map((m, index) => ({
      id: anonymizedPlayerIdMap[m.id],
      displayName: `Player ${index + 1}`,
    }));
    const anonymizedChat = chat.map((message) =>
      message.authorId === 'system'
        ? message
        : {
            ...message,
            authorId: anonymizedPlayerIdMap[message.authorId] || 'unknown',
            content: '<redacted>',
          },
    );

    return {
      gameId: sessionData.gameId,
      gameVersion: sessionData.gameVersion,
      createdAt: sessionData.createdAt,
      endedAt: sessionData.endedAt,
      abandonedAt: sessionData.abandonedAt,
      randomSeed: sessionData.randomSeed,
      setupData,
      members: anonymizedMembers,
      rounds: rounds.map((r) => ({
        roundIndex: r.roundIndex,
        turns: r.turns.map((t) => ({
          playerId: anonymizedPlayerIdMap[t.playerId] || 'unknown',
          data: t.data,
        })),
      })),
      chat: anonymizedChat,
    };
  }
}
