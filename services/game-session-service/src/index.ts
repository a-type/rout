import { GameRound } from '@long-game/common';
import { PrefixedId } from '@long-game/db';
import { GameRandom, GameStatus, Turn } from '@long-game/game-definition';
import games from '@long-game/games';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { requestId } from 'hono/request-id';
import { handleError } from '../../common/middleware/errors.js';
import {
  loggedInMiddleware,
  sessionMiddleware,
  SessionWithPrefixedIds,
} from '../../common/middleware/session.js';
import type { PublicStore } from '../../db-service/src/index.js';

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
 * While storing members may seem redundant, because game deterministic
 * logic is based on the members, it's more consistent to store them
 * alongside other deterministic seed data. Supposing some membership
 * is somehow lost in the main DB, that won't ruin the game state.
 *
 * These are objects to allow future extension if necessary.
 */
export type GameSessionMember = {
  id: PrefixedId<'u'>;
};

export type GameSessionChatMessage = {
  id: PrefixedId<'cm'>;
  createdAt: Date;
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

  /**
   * Called once to store critical initial data
   * for the game.
   */
  initialize(data: GameSessionBaseData) {
    this.#sessionData = data;
    this.ctx.storage.put('sessionData', data);
  }

  get isInitialized(): boolean {
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
  }): GameRound<GameSessionTurn>[] {
    const resolvedUpTo =
      upTo === 'current' ? this.getCurrentRoundIndex() : upTo;
    // group turns into rounds, providing up to the specified round if needed
    return this.#turns.reduce<GameRound<GameSessionTurn>[]>((acc, turn) => {
      if (resolvedUpTo !== undefined && turn.roundIndex > resolvedUpTo) {
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
    const globalState = this.getGlobalState(roundIndex);
    return this.gameDefinition.getPlayerState({
      globalState,
      playerId,
      roundIndex: roundIndex ?? this.getCurrentRoundIndex(),
      members: this.#sessionData.members,
      rounds: this.getRounds({ upTo: roundIndex }),
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
   * Adds (and stores) a turn to the game session.
   */
  addTurn(turn: GameSessionTurn) {
    this.#turns.push(turn);
    this.ctx.storage.put('turns', this.#turns);
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
  };
  Bindings: Env;
}>(async (ctx, next) => {
  const id = ctx.req.param('id');
  if (!id) {
    throw new Error(
      'No game session ID provided. Middleware misconfiguration?',
    );
  }
  const durableObjectId = ctx.env.GAME_SESSION_STATE.idFromName(id);
  const sessionState = ctx.env.GAME_SESSION_STATE.get(durableObjectId);
  if (!sessionState.isInitialized) {
    throw new Error(
      'Game session not initialized. Call /start on the game session API.',
    );
  }
  ctx.set('gameSessionState', sessionState);
  return next();
});

const gameSessionStateApp = new Hono<{ Bindings: Env }>()
  .use(openGameSessionMiddleware)
  .get('/state', async (ctx) => {
    const userId = ctx.get('session').userId;
    const state = ctx.get('gameSessionState');
    // @ts-expect-error - excessive recursion...
    return ctx.json(await state.getPlayerState(userId));
  })
  .get('/status', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const value = await state.getStatus();
    value.status;
    return ctx.json(value);
  })
  .get('/chat', async (ctx) => {
    const userId = ctx.get('session').userId;
    const state = ctx.get('gameSessionState');
    return ctx.json(await state.getChatForPlayer(userId));
  });

const gameSessionApp = new Hono<{ Bindings: Env }>()
  .onError(handleError)
  .use(requestId())
  .use(sessionMiddleware)
  .use(loggedInMiddleware)
  .route('/:id', gameSessionStateApp);

export default gameSessionApp;

export type AppType = typeof gameSessionApp;
