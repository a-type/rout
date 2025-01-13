import { zValidator } from '@hono/zod-validator';
import {
  assertPrefixedId,
  GameRound,
  id,
  isPrefixedId,
  LongGameError,
  PrefixedId,
  wrapRpcData,
} from '@long-game/common';
import {
  GameRandom,
  GameStatus,
  getLatestVersion,
  Turn,
} from '@long-game/game-definition';
import games from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { requestId } from 'hono/request-id';
import { z } from 'zod';
import type { AuthedStore, PublicStore } from '../db';
import { GameSessionInvitation } from '../db/kysely';
import {
  handleError,
  loggedInMiddleware,
  sessionMiddleware,
  SessionWithPrefixedIds,
} from '../middleware';

interface Env {
  PUBLIC_STORE: PublicStore;
  GAME_SESSION_STATE: DurableObjectNamespace<GameSessionState>;
}

/**
 * The basic initial data required to set up a game.
 */
export type GameSessionBaseData = {
  randomSeed: string;
  startedAt: Date | null;
  endedAt: Date | null;
  gameId: string;
  timezone: string;
  members: GameSessionMember[];
  gameVersion: string;
};

export type GameSessionTurn = Turn<any>;

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

export type GameSessionChatMessage = {
  id: PrefixedId<'cm'>;
  createdAt: number;
  authorId: PrefixedId<'u'>;
  content: string;
  /**
   * Optionally, chats can be placed on a game scene
   */
  position?: { x: number; y: number };
  /**
   * If specified, positioned chats should only be visible
   * on the game scene that matches this ID. Game scene IDs
   * are arbitrary and determined (and interpreted) by the game.
   */
  sceneId?: string;
  /**
   * If specified, this message should only be delivered
   * to these recipients.
   */
  recipientIds?: PrefixedId<'u'>[];
};

export type GameSessionSummary = {
  id: string;
  status: GameStatus;
  gameId: string;
  gameVersion: string;
  members: GameSessionMember[];
};

/**
 * Game Session State is responsible for storing the data required to compute
 * the state of a game session at any given time. This includes the game
 * seed, the turns applied, and the canonical game members.
 */
export class GameSessionState extends DurableObject<Env> {
  #sessionData: GameSessionBaseData | null = null;
  #turns: GameSessionTurn[] = [];
  #chat: GameSessionChatMessage[] = [];
  /**
   * Precomputed global states per-round
   */
  #globalStateCache: unknown[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // load initial state from storage
    ctx.blockConcurrencyWhile(async () => {
      this.#sessionData = (await ctx.storage.get('sessionData')) || null;
      this.#turns = (await ctx.storage.get('turns')) || [];
      this.#chat = (await ctx.storage.get('chat')) || [];
    });
  }

  private get gameDefinition() {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const { gameId, gameVersion } = this.#sessionData;
    const gameModule = games[gameId];
    if (!gameModule) {
      throw new Error(`Game module for ${gameId} not found`);
    }

    const gameDefinition = gameModule.versions.find(
      (v) => v.version === gameVersion,
    );

    if (!gameDefinition) {
      throw new Error(`Game version ${gameVersion} not found`);
    }

    return gameDefinition;
  }

  private setSessionData(data: Partial<GameSessionBaseData>) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    this.#sessionData = {
      ...this.#sessionData,
      ...data,
    };
    this.ctx.storage.put('sessionData', this.#sessionData);
  }

  /**
   * Called once to store critical initial data
   * for the game.
   */
  initialize(
    data: Pick<
      GameSessionBaseData,
      'randomSeed' | 'gameId' | 'gameVersion' | 'members' | 'timezone'
    >,
  ) {
    this.#sessionData = {
      startedAt: null,
      endedAt: null,
      ...data,
    };
    this.ctx.storage.put('sessionData', this.#sessionData);
  }

  updateMembers(members: GameSessionMember[]) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.#sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update members after game has started',
      );
    }
    this.setSessionData({ members });
  }

  updateGame(gameId: string, gameVersion: string) {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    if (this.#sessionData.startedAt) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot update game after game has started',
      );
    }
    this.setSessionData({ gameId, gameVersion });
  }

  startGame() {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Session data not initialized',
      );
    }
    // last chance to update the game version before beginning play
    const gameModule = games[this.#sessionData.gameId];
    if (!gameModule) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game module not found',
      );
    }

    const gameDefinition = getLatestVersion(gameModule);
    this.updateGame(this.#sessionData.gameId, gameDefinition.version);

    // start the game
    this.setSessionData({ startedAt: new Date() });
  }

  getIsInitialized(): boolean {
    return Boolean(this.#sessionData);
  }

  getCurrentRoundIndex(): number {
    if (!this.#sessionData?.startedAt) {
      return 0;
    }
    return this.gameDefinition.getRoundIndex({
      currentTime: new Date(),
      gameTimeZone: this.#sessionData.timezone,
      members: this.#sessionData.members,
      startedAt: this.#sessionData.startedAt,
      turns: this.#turns,
    });
  }

  /**
   * Computes turns into grouped rounds, optionally up to (not including)
   * the specified round
   */
  getRounds({
    upTo,
  }: {
    upTo?: number | 'current';
  } = {}): GameRound<GameSessionTurn>[] {
    const resolvedUpTo =
      upTo === 'current' ? this.getCurrentRoundIndex() : upTo;
    // group turns into rounds, providing up to the specified round if needed
    return this.#turns.reduce<GameRound<GameSessionTurn>[]>((acc, turn) => {
      if (resolvedUpTo !== undefined && turn.roundIndex >= resolvedUpTo) {
        return acc;
      }
      const round = acc[turn.roundIndex] ?? {
        roundIndex: turn.roundIndex,
        turns: [],
      };
      round.turns.push(turn);
      acc[turn.roundIndex] = round;
      return acc;
    }, []);
  }

  /**
   * Get the public state for a particular player at a particular round.
   * Defaults to current round.
   */
  getPlayerState(playerId: PrefixedId<'u'>, roundIndex?: number): any {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const currentRoundIndex = this.getCurrentRoundIndex();
    if (roundIndex && roundIndex >= currentRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    const resolvedRoundIndex = roundIndex ?? currentRoundIndex - 1;
    const globalState = this.getGlobalState(roundIndex);
    return this.gameDefinition.getPlayerState({
      globalState,
      playerId,
      roundIndex: resolvedRoundIndex,
      members: this.#sessionData.members,
      rounds: this.getRounds({ upTo: resolvedRoundIndex + 1 }),
    });
  }

  getPublicRounds(playerId: PrefixedId<'u'>, { upTo }: { upTo?: number } = {}) {
    const currentRoundIndex = this.getCurrentRoundIndex();
    if (upTo && upTo >= currentRoundIndex) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Cannot access current or future round states. Play your turn to see what comes next!',
      );
    }
    const resolvedUpTo = upTo ?? currentRoundIndex - 1;
    return this.getRounds({ upTo: resolvedUpTo }).map((round) => {
      return {
        ...round,
        turns: round.turns.map((turn) => {
          return this.gameDefinition.getPublicTurn({
            turn,
            globalState: this.getGlobalState(round.roundIndex),
            viewerId: playerId,
          });
        }),
      };
    });
  }

  /**
   * Get the global state for a particular round. Defaults to current round.
   */
  getGlobalState(roundIndex?: number): any {
    if (!this.#sessionData) {
      throw new Error('Session data not initialized');
    }
    const random = new GameRandom(this.#sessionData.randomSeed);
    const initialState = this.gameDefinition.getInitialGlobalState({
      random,
      members: this.#sessionData.members,
    });
    // check cache first. we never cache the current round (since it's mutable)
    // so we skip if no roundIndex is provided
    if (roundIndex && this.#globalStateCache[roundIndex]) {
      return this.#globalStateCache[roundIndex];
    }
    const computed = this.gameDefinition.getState({
      initialState,
      rounds: this.getRounds({ upTo: roundIndex }),
      random,
      members: this.#sessionData.members,
    });
    if (roundIndex) {
      this.#globalStateCache[roundIndex] = computed;
    }
    return computed;
  }

  /**
   * Shortcut to get the current round of turns.
   * NOTE: this is not public info.
   */
  getCurrentRound() {
    const currentRoundIndex = this.getCurrentRoundIndex();
    return this.getRound(currentRoundIndex);
  }

  /**
   * Gets a specific round of turns.
   * NOTE: this is not necessarily public info. Could be used to leak
   * current round if no validation is applied to prevent accessing
   * the current round index.
   */
  getRound(roundIndex: number): GameRound<GameSessionTurn> {
    return {
      turns: this.#turns.filter((turn) => turn.roundIndex === roundIndex),
      roundIndex,
    };
  }

  /**
   * Gets information relevant to the status of players in the current round.
   */
  getPlayerStatuses(): Record<string, { hasPlayed: boolean }> {
    const currentRound = this.getCurrentRound();
    return (this.#sessionData?.members ?? []).reduce<
      Record<string, { hasPlayed: boolean }>
    >((acc, member) => {
      acc[member.id] = {
        hasPlayed: currentRound.turns.some(
          (turn) => turn.playerId === member.id,
        ),
      };
      return acc;
    }, {});
  }

  /**
   * Adds (and stores) a turn to the game session for the current
   * round.
   */
  addTurn(playerId: PrefixedId<'u'>, turn: any) {
    const currentRoundIndex = this.getCurrentRoundIndex();
    this.#turns.push({
      roundIndex: currentRoundIndex,
      createdAt: new Date().toUTCString(),
      data: turn,
      playerId,
    });
    this.ctx.storage.put('turns', this.#turns);
  }

  getCurrentTurn(playerId: PrefixedId<'u'>): GameSessionTurn | null {
    const currentRoundIndex = this.getCurrentRoundIndex();
    return (
      this.#turns.find(
        (turn) =>
          turn.roundIndex === currentRoundIndex && turn.playerId === playerId,
      ) ?? {
        data: null,
        createdAt: new Date().toUTCString(),
        playerId,
        roundIndex: currentRoundIndex,
      }
    );
  }

  /**
   * Get the game status, which indicates game progress and outcome.
   */
  getStatus(): GameStatus {
    if (!this.#sessionData?.startedAt) {
      return {
        status: 'pending',
      };
    }

    return this.gameDefinition.getStatus({
      globalState: this.getGlobalState(),
      members: this.#sessionData.members,
      rounds: this.getRounds({ upTo: 'current' }),
    });
  }

  getSummary(): GameSessionSummary {
    if (!this.#sessionData) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Game session has not been initialized',
      );
    }
    return {
      id: this.ctx.id.toString(),
      status: this.getStatus(),
      members: this.#sessionData.members,
      gameId: this.#sessionData.gameId,
      gameVersion: this.#sessionData.gameVersion,
    };
  }

  addChatMessage(message: GameSessionChatMessage) {
    this.#chat.push(message);
    this.ctx.storage.put('chat', this.#chat);
  }

  getChatForPlayer(playerId: PrefixedId<'u'>): GameSessionChatMessage[] {
    return this.#chat.filter((message) => {
      if (message.recipientIds) {
        return message.recipientIds.includes(playerId);
      }
      return true;
    });
  }
}

const openGameSessionMiddleware = createMiddleware<{
  Variables: {
    gameSessionState: DurableObjectStub<GameSessionState>;
    session: SessionWithPrefixedIds;
    gameSessionId: PrefixedId<'gs'>;
    // an invitation existing is the authorization for
    // accessing the game session state
    myInvitation: GameSessionInvitation;
    // easier just to drop this on since we have it
    userStore: AuthedStore;
  };
  Bindings: Env;
}>(async (ctx, next) => {
  const id = ctx.req.param('id');
  if (!id) {
    throw new Error(
      'No game session ID provided. Middleware misconfiguration?',
    );
  }
  assertPrefixedId(id, 'gs');
  const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(
    ctx.get('session').userId,
  );
  ctx.set('userStore', userStore);
  const myInvitation =
    await userStore.getGameSessionInvitationForSpecificSession(id);
  if (!myInvitation) {
    throw new LongGameError(
      LongGameError.Code.Forbidden,
      'You were not invited to this game session.',
    );
  }
  if (
    myInvitation.status === 'declined' ||
    myInvitation.status === 'expired' ||
    myInvitation.status === 'uninvited'
  ) {
    throw new LongGameError(
      LongGameError.Code.Forbidden,
      'Your invitation to this game session was revoked. Please ask for another invite.',
    );
  }
  const durableObjectId = ctx.env.GAME_SESSION_STATE.idFromName(id);
  const sessionState = ctx.env.GAME_SESSION_STATE.get(durableObjectId);
  if (!sessionState.getIsInitialized()) {
    throw new Error(
      'Game session not initialized. POST to gameSessions/prepare on the public API.',
    );
  }
  ctx.set('gameSessionState', sessionState);
  ctx.set('gameSessionId', id);
  return next();
});

const gameSessionStateApp = new Hono<{ Bindings: Env }>()
  .use(openGameSessionMiddleware)
  .get('/', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const summary = await state.getSummary();
    return ctx.json({ session: summary });
  })
  .get('/playerState', async (ctx) => {
    const userId = ctx.get('session').userId;
    const state = ctx.get('gameSessionState');
    // @ts-ignore
    const playerState = (await state.getPlayerState(userId)) as any;
    return ctx.json(playerState);
  })
  .get('/currentTurn', async (ctx) => {
    const userId = ctx.get('session').userId;
    const state = ctx.get('gameSessionState');
    const currentTurn = (await state.getCurrentTurn(userId)) as Turn<any>;
    return ctx.json(currentTurn);
  })
  .get('/members', async (ctx) => {
    const userStore = ctx.get('userStore');
    const members = await userStore.getGameSessionMembers(
      ctx.get('gameSessionId'),
    );
    return ctx.json(members);
  })
  .get('/invitations', async (ctx) => {
    const userStore = ctx.get('userStore');
    const invitations = await userStore.getInvitationsToGameSession(
      ctx.get('gameSessionId'),
    );
    return ctx.json(invitations);
  })
  .get('/status', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const value = await state.getStatus();
    value.status;
    return ctx.json(value);
  })
  .get('/pregame', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const sessionId = ctx.get('gameSessionId');
    const userStore = ctx.get('userStore');
    const myInvitation = ctx.get('myInvitation');
    const [members, invitations, summary] = await Promise.all([
      userStore.getGameSessionMembers(sessionId),
      userStore.getInvitationsToGameSession(sessionId),
      state.getSummary(),
    ]);

    return ctx.json({
      members,
      invitations,
      myInvitation,
      session: summary,
    });
  })
  .get('/chat', async (ctx) => {
    const userId = ctx.get('session').userId;
    const state = ctx.get('gameSessionState');
    const chat = await state.getChatForPlayer(userId);
    return ctx.json(wrapRpcData(chat));
  })
  .get(
    '/rounds',
    zValidator(
      'query',
      z.object({
        upTo: z.number().optional(),
      }),
    ),
    async (ctx) => {
      const state = ctx.get('gameSessionState');
      const rounds = await state.getPublicRounds(ctx.get('session').userId, {
        upTo: ctx.req.valid('query').upTo,
      });
      return ctx.json(wrapRpcData(rounds));
    },
  )
  .post('/start', async (ctx) => {
    const state = ctx.get('gameSessionState');
    state.startGame();
    const summary = await state.getSummary();
    return ctx.json({ session: summary });
  })
  .put(
    '/',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const { gameId } = ctx.req.valid('json');
      const state = ctx.get('gameSessionState');
      state.updateGame(gameId, getLatestVersion(games[gameId]).version);
      const summary = state.getSummary();
      return ctx.json({ session: summary });
    },
  )
  .put(
    '/turn',
    zValidator(
      'json',
      z.object({
        turn: z.object({}),
      }),
    ),
    async (ctx) => {
      const { turn } = ctx.req.valid('json');
      const state = ctx.get('gameSessionState');
      state.addTurn(ctx.get('session').userId, turn);
      return ctx.json({ success: true });
    },
  )
  .post(
    '/chat',
    zValidator(
      'json',
      z.object({
        content: z.string(),
        recipientIds: z.array(z.custom((v) => isPrefixedId(v, 'u'))).optional(),
      }),
    ),
    async (ctx) => {
      const { content, recipientIds } = ctx.req.valid('json');
      const state = ctx.get('gameSessionState');
      state.addChatMessage({
        id: id('cm'),
        authorId: ctx.get('session').userId,
        content,
        createdAt: Date.now(),
        recipientIds: recipientIds as PrefixedId<'u'>[],
      });
      return ctx.json({ success: true });
    },
  );

const gameSessionApp = new Hono<{ Bindings: Env }>()
  .onError(handleError)
  .use(requestId())
  .use(sessionMiddleware)
  .use(loggedInMiddleware)
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const { gameId } = ctx.req.valid('json');
      const game = games[gameId];

      if (!game) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game not found',
        );
      }
      const gameDefinition = getLatestVersion(game);

      const sessionId = id('gs');
      const durableObjectId = ctx.env.GAME_SESSION_STATE.idFromName(sessionId);
      const sessionState = await ctx.env.GAME_SESSION_STATE.get(
        durableObjectId,
      );
      const randomSeed = crypto.randomUUID();
      const userId = ctx.get('session').userId;
      await sessionState.initialize({
        randomSeed,
        gameId: game.id,
        gameVersion: gameDefinition.version,
        members: [
          {
            id: userId,
          },
        ],
        // TODO: configurable / automatic detection
        timezone: 'America/New_York',
      });

      // insert founding membership so the user can find this session
      const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(userId);
      await userStore.insertFoundingGameMembership(sessionId);

      return ctx.json({ sessionId });
    },
  )
  .route('/:id', gameSessionStateApp);

export default gameSessionApp;

export type AppType = typeof gameSessionApp;
