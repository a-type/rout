import { zValidator } from '@hono/zod-validator';
import {
  assertPrefixedId,
  id,
  LongGameError,
  PrefixedId,
  wrapRpcData,
} from '@long-game/common';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { requestId } from 'hono/request-id';
import { z } from 'zod';
import { GameSessionState } from '.';
import type { AuthedStore } from '../db';
import type { GameSessionInvitation } from '../db/kysely';
import {
  handleError,
  loggedInMiddleware,
  SessionWithPrefixedIds,
} from '../middleware';
import { configuredCors } from '../middleware/cors';
import { Env } from './env';
import { getSocketToken } from './socketTokens';

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
  ctx.set('myInvitation', myInvitation);
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
  .use(configuredCors())
  .use(openGameSessionMiddleware)
  .get('/', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const userId = ctx.get('session').userId;
    const info = await state.getSummary(userId);
    const body = wrapRpcData(info);
    return ctx.json(body);
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
      state.getInfo(),
    ]);

    return ctx.json({
      members,
      invitations,
      myInvitation,
      session: summary,
    });
  })
  .get(
    '/rounds/:index',
    zValidator(
      'param',
      z.object({
        index: z.coerce.number().int(),
      }),
    ),
    async (ctx) => {
      const state = ctx.get('gameSessionState');
      const roundIndex = ctx.req.valid('param').index;
      const userId = ctx.get('session').userId;
      const round = await state.getPublicRound(userId, roundIndex);
      return ctx.json(wrapRpcData(round));
    },
  )
  .post('/start', async (ctx) => {
    const id = ctx.get('gameSessionId');
    const state = ctx.get('gameSessionState');
    // make sure we've locked in the correct members
    const members = await ctx.get('userStore').getGameSessionMembers(id);
    await state.updateMembers(members);
    await state.startGame();
    const status = await state.getStatus();
    return ctx.json({ status });
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
      const summary = await state.getInfo();
      return ctx.json({ session: summary });
    },
  )
  .get('/socketToken', async (ctx) => {
    const token = await getSocketToken(
      ctx.get('session'),
      ctx.get('gameSessionId'),
      ctx.env.SOCKET_TOKEN_SECRET,
    );
    return ctx.json({ token });
  });

export const api = new Hono<{ Bindings: Env }>()
  .onError(handleError)
  .use(requestId())
  .use(loggedInMiddleware)
  .post(
    '/',
    configuredCors(),
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
        id: sessionId,
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
  .all('/:id/socket', async (ctx) => {
    const state = ctx.env.GAME_SESSION_STATE.get(
      ctx.env.GAME_SESSION_STATE.idFromName(ctx.req.param('id')),
    );
    return state.fetch(ctx.req.raw);
  })
  .route('/:id', gameSessionStateApp);

export type AppType = typeof api;
