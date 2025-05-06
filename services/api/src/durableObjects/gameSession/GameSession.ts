import {
  GameRound,
  GameSessionChatMessage,
  GameSessionPlayerStatus,
  GameStatus,
  id,
  LongGameError,
  PrefixedId,
  SYSTEM_CHAT_AUTHOR_ID,
} from '@long-game/common';
import {
  BaseTurnData,
  getGameState,
  getLatestVersion,
  RoundIndexResult,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { notifyUser } from '../../services/notification';
import { GameSessionSocketHandler } from './GameSessionSocketHandler';
import { db, SqlWrapper } from './sql';

export interface GameSessionBaseData {
  id: PrefixedId<'gs'>;
  randomSeed: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  gameId: string;
  gameVersion: string;
  timezone: string;
  members: GameSessionMember[];
}

export type GameSessionTurn = Turn<{}>;

/**
 * These member stubs connect to User ids in the core database,
 * but don't store any redundant data about those users, which
 * is irrelevant to the game state. Look up the users from
 * the core database when needed.
 * These are objects to allow future extension if necessary.
 */
export type GameSessionMember = {
  id: PrefixedId<'u'>;
};

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

export class GameSession extends DurableObject<ApiBindings> {
  #sql: SqlWrapper;
  #socketHandler: GameSessionSocketHandler;

  constructor(ctx: DurableObjectState, env: ApiBindings) {
    super(ctx, env);
    this.#sql = new SqlWrapper(ctx.storage);
    this.#socketHandler = new GameSessionSocketHandler(this, ctx, env);
  }

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
    const data = await this.ctx.storage.get('sessionData');
    if (!data) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    return data as GameSessionBaseData;
  }
  async #hasSessionData(): Promise<boolean> {
    const data = await this.ctx.storage.get('sessionData');
    return Boolean(data);
  }
  async #setSessionData(data: GameSessionBaseData) {
    await this.ctx.storage.put('sessionData', data);
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
        roundIndex: 0,
      }
    );
  }
  async #setRoundState(notifications: GameSessionRoundState) {
    await this.ctx.storage.put('notifications', notifications);
    return notifications;
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
  async getGameDefinition() {
    const { gameId, gameVersion } = await this.#getSessionData();
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
    return (await this.#getSessionData()).members.sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }

  async delete() {
    if (await this.getIsInitialized()) {
      const sessionData = await this.#getSessionData();
      if (sessionData.startedAt) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Cannot delete a game session that has started',
        );
      }
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
      'id' | 'randomSeed' | 'gameId' | 'gameVersion' | 'timezone' | 'members'
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
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update members after game has started',
      );
    }
    await this.#updateSessionData({ members });
    this.#socketHandler.send({
      type: 'membersChange',
      members: await this.getMembers(),
    });
  }
  async updateGame(gameId: string, gameVersion: string): Promise<void> {
    const sessionData = await this.#getSessionData();
    if (sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update game after game has started',
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
    await this.#updateStatus('active');

    await this.#checkForRoundChange();
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
    const statuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus> = {};
    for (const member of members) {
      statuses[member.id] = {
        online: this.#socketHandler.getIsPlayerOnline(member.id),
      };
    }
    return statuses;
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

    console.log(turn, playerState, currentRoundIndex);
    const validationError = gameDefinition.validateTurn({
      turn: {
        data: turn,
        playerId,
      },
      playerState,
      roundIndex: currentRoundIndex,
      members,
    });
    if (validationError) {
      throw new LongGameError(LongGameError.Code.BadRequest, validationError);
    }

    console.log(
      `Adding turn for player ${playerId} in round ${currentRoundIndex}`,
    );
    await this.#applyTurn(turn, playerId, currentRoundIndex);
    console.log(
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
  async getSummary() {
    const sessionData = await this.#getSessionData();
    return {
      id: sessionData.id,
      status: await this.getStatus(),
      gameId: sessionData.gameId,
      gameVersion: sessionData.gameVersion,
      members: await this.getMembers(),
      startedAt: sessionData.startedAt,
      timezone: sessionData.timezone,
      endedAt: sessionData.endedAt,
    };
  }
  async getDetails(userId: PrefixedId<'u'>): Promise<{
    id: PrefixedId<'gs'>;
    status: GameStatus;
    gameId: string;
    gameVersion: string;
    members: GameSessionMember[];
    startedAt: string | null;
    timezone: string;
    endedAt: string | null;
    playerId: PrefixedId<'u'>;
    playerState: {};
    currentRound: GameRound<{ playerId: PrefixedId<'u'>; data: {} | null }> & {
      initialPlayerState: {};
      yourTurnData: {} | null;
    };
    playerStatuses: Record<PrefixedId<'u'>, GameSessionPlayerStatus>;
  }> {
    const summary = await this.getSummary();
    const currentRoundIndex = await this.getCurrentRoundIndex();
    return {
      ...summary,
      playerId: userId,
      playerState: (await this.getPlayerState(userId)) as {},
      currentRound: await this.getPublicRound(userId, currentRoundIndex),
      playerStatuses: await this.getPlayerStatuses(),
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
      roundIndex: 0,
      playersNotified: {},
    });
    this.#socketHandler.send({
      type: 'gameChange',
    });
  }

  // chat
  async addChatMessage(message: GameSessionChatMessage) {
    console.log(`Chat message from ${message.authorId}`);
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
      })
      .onConflict((oc) => oc.column('id').doNothing());
    await this.#sql.run(query);
    this.#socketHandler.send({
      type: 'chat',
      messages: [message],
    });
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
  async getChatForPlayer(
    playerId: PrefixedId<'u'>,
    pagination: {
      limit: number;
      nextToken?: string | null;
    } = { limit: 100 },
  ) {
    const { limit, nextToken } = pagination;
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
    if (!gameIsOver) {
      sql = sql
        .where('ChatMessage.roundIndex', '>=', 0)
        .where(
          'ChatMessage.roundIndex',
          '<=',
          await this.getPublicRoundIndex(),
        );
    }
    const result = await this.#sql.run(sql);
    const messages = result.reverse().map((row) => {
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
        position: row.positionJSON ? JSON.parse(row.positionJSON) : undefined,
        recipientIds,
        metadata: row.metadataJSON ? JSON.parse(row.metadataJSON) : undefined,
      };
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

  // private state
  async #updateStatus(status: 'pending' | 'active' | 'complete') {
    const currentData = await this.#getSessionData();
    if (status === 'active') {
      if (!currentData.startedAt) {
        await this.#updateSessionData({
          startedAt: new Date().toISOString(),
        });
      }
    } else if (status === 'complete') {
      if (!currentData.endedAt) {
        await this.#updateSessionData({
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
    return turns.reduce<GameRound<GameSessionTurn>[]>(
      (acc, turn) => {
        const round = acc[turn.roundIndex] ?? {
          roundIndex: turn.roundIndex,
          turns: [],
        };
        round.turns.push(turn);
        acc[turn.roundIndex] = round;
        return acc;
      },
      new Array(Math.max(upToAndIncluding, 0))
        .fill(null)
        .map<GameRound<GameSessionTurn>>(() => ({
          roundIndex: 0,
          turns: [],
        })),
    );
  }
  async #getGlobalStateUnchecked(
    upToAndIncludingRoundIndex?: number,
  ): Promise<{}> {
    const roundIndex =
      upToAndIncludingRoundIndex ?? (await this.getCurrentRoundIndex());
    const rounds = await this.#getRoundsUnchecked({
      upToAndIncluding: roundIndex,
    });
    const gameDefinition = await this.getGameDefinition();
    const members = await this.getMembers();
    const sessionData = await this.#getSessionData();
    const computed = getGameState(gameDefinition, {
      rounds,
      randomSeed: sessionData.randomSeed,
      members,
    });
    return computed;
  }
  async #getPlayerStateUnchecked(
    playerId: PrefixedId<'u'>,
    upToAndIncludingRoundIndex?: number,
  ): Promise<unknown> {
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
    const globalState = await this.#getGlobalStateUnchecked(
      latestRoundFromTurns,
    );
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
    await notifyUser(
      playerId,
      {
        type: 'turn-ready',
        gameId: sessionData.gameId,
        gameSessionId: sessionData.id,
        id: id('no'),
      },
      this.env,
    );
  }

  /**
   * Call after material changes are made to the game
   * state. This will recompute the round and send or
   * schedule notifications to players.
   */
  #checkForRoundChange = async () => {
    const roundState = await this.#getCurrentRoundState();
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
        const members = await this.getMembers();
        for (const member of members) {
          this.#socketHandler.send(
            {
              type: 'roundChange',
              completedRound: await this.getPublicRound(
                member.id,
                roundState.roundIndex - 1,
              ),
              newRound: await this.getPublicRound(
                member.id,
                roundState.roundIndex,
              ),
            },
            {
              to: [member.id],
            },
          );
        }
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
          console.error(
            `Failed to send player notification to ${playerId}`,
            err,
          );
        }
      } else {
        console.log(`Player ${playerId} already notified of turn, skipping`);
      }
    }
    if (roundState.checkAgainAt) {
      console.log(`Scheduling check again at ${roundState.checkAgainAt}`);
      this.ctx.storage.setAlarm(roundState.checkAgainAt);
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
        await Promise.all(
          roundChangeMessages.map((message) =>
            this.addChatMessage({
              ...message,
              id: id('cm'),
              createdAt: new Date().toISOString(),
              authorId: SYSTEM_CHAT_AUTHOR_ID,
              roundIndex: roundIndex,
            }),
          ),
        );
      }
    }
  };

  async alarm() {
    if (!(await this.#hasSessionData())) {
      return;
    }
    this.#checkForRoundChange();
  }
}
