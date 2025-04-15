import { zValidator } from '@hono/zod-validator';
import {
  assertPrefixedId,
  LongGameError,
  PrefixedId,
  wrapRpcData,
} from '@long-game/common';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import type { GameSessionInvitation, UserStore } from '@long-game/service-db';
import { RpcStub } from 'cloudflare:workers';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import { getSocketToken } from '../auth/socketTokens';
import { Env } from '../config/ctx';
import { GameSessionState } from '../durableObjects/GameSessionState';
import { SessionWithPrefixedIds } from '../middleware';

const openGameSessionMiddleware = createMiddleware<{
  Variables: {
    gameSessionState: DurableObjectStub<GameSessionState>;
    session: SessionWithPrefixedIds;
    gameSessionId: PrefixedId<'gs'>;
    // an invitation existing is the authorization for
    // accessing the game session state
    myInvitation: GameSessionInvitation;
    // easier just to drop this on since we have it
    userStore: RpcStub<UserStore>;
  };
  Bindings: ApiBindings;
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
  const sessionState = await ctx.env.GAME_SESSION_STATE.get(durableObjectId);
  if (!sessionState.getIsInitialized()) {
    throw new Error(
      'Game session not initialized. POST to gameSessions/prepare on the public API.',
    );
  }
  ctx.set('gameSessionState', sessionState as any);
  ctx.set('gameSessionId', id);
  return next();
});

export const gameSessionRouter = new Hono<Env>()
  .use(openGameSessionMiddleware)
  .get('/', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const userId = ctx.get('session').userId;
    const info = await state.getDetails(userId);
    const body = wrapRpcData(info);
    return ctx.json(body);
  })
  .get('/summary', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const summary = await state.getSummary();
    return ctx.json(wrapRpcData(summary));
  })
  .get('/members', async (ctx) => {
    const userStore = ctx.get('userStore');
    const members = await userStore.getGameSessionMembers(
      ctx.get('gameSessionId'),
    );
    return ctx.json(wrapRpcData(members));
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

    // while in pregame, double check that vital data is
    // synced to the DO...
    if (summary.status.status === 'pending') {
      state.updateMembers(members);
    }

    return ctx.json({
      members: wrapRpcData(members),
      invitations: wrapRpcData(invitations),
      myInvitation,
      session: wrapRpcData(summary),
    });
  })
  .get('/postgame', async (ctx) => {
    const state = ctx.get('gameSessionState');
    // @ts-ignore - excessive... etc...
    const globalState = await state.getGlobalState();
    const rounds = await state.getRounds();

    return ctx.json({
      globalState: wrapRpcData(globalState as Disposable),
      rounds: wrapRpcData(rounds),
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
      const summary = await state.getSummary();
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
