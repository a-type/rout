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
import { getSocketToken } from '../auth/socketTokens.js';
import { Env } from '../config/ctx.js';
import { GameSession } from '../durableObjects/gameSession/GameSession.js';
import { SessionWithPrefixedIds } from '../middleware/index.js';

const openGameSessionMiddleware = createMiddleware<{
  Variables: {
    gameSessionState: DurableObjectStub<GameSession>;
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
    // don't leak existence
    throw new LongGameError(
      LongGameError.Code.NotFound,
      `Could not find game session ${id}`,
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
  const durableObjectId = ctx.env.GAME_SESSION.idFromName(id);
  const sessionState = await ctx.env.GAME_SESSION.get(durableObjectId);
  if (!sessionState.getIsInitialized()) {
    throw new LongGameError(
      LongGameError.Code.InternalServerError,
      "Game session not initialized. This is a bug, sorry. This game can't be played until support fixes it.",
    );
  }
  ctx.set('gameSessionState', sessionState as any);
  ctx.set('gameSessionId', id);
  try {
    return await next();
  } finally {
    userStore[Symbol.dispose]();
  }
});

export const gameSessionRouter = new Hono<Env>()
  .use(openGameSessionMiddleware)
  .get('/', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const userId = ctx.get('session').userId;
    const info = await state.getDetails();
    const body = wrapRpcData({
      ...info,
      playerId: userId,
    });
    return ctx.json(body);
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
    return ctx.json(wrapRpcData(invitations));
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
    using members = await userStore.getGameSessionMembers(sessionId);
    using invitations = await userStore.getInvitationsToGameSession(sessionId);
    using summary = await state.getDetails();
    using votes = await state.getGameVotes();
    using readyPlayers = await state.getReadyPlayers();

    // while in pregame, double check that vital data is
    // synced to the DO...
    await state.updateMembers(members);

    return ctx.json({
      members: wrapRpcData(members),
      invitations: wrapRpcData(invitations),
      myInvitation,
      session: wrapRpcData(summary),
      votes: wrapRpcData(votes),
      readyPlayers: wrapRpcData(readyPlayers),
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
  // dev mode only
  .get('/turns', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const turns = await state.getTurns();
    return ctx.json(wrapRpcData(turns));
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
      await state.updateGame(
        gameId,
        getLatestVersion(games[gameId]).version,
        ctx.get('session').userId,
      );
      const summary = await state.getDetails();
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
  })
  .get('/inviteLink', async (ctx) => {
    const userStore = ctx.get('userStore');
    const gameSessionId = ctx.get('gameSessionId');
    const code =
      await userStore.getGameSessionInvitationLinkCode(gameSessionId);
    const link = new URL(`/gameInvite/${code}`, ctx.env.UI_ORIGIN);
    return ctx.json({ link: link.toString() });
  })
  .get('/availableGames', async (ctx) => {
    const gameIds = await ctx
      .get('userStore')
      .getAvailableGamesForSession(ctx.get('gameSessionId'));
    return ctx.json(wrapRpcData(gameIds));
  })
  .delete('/', async (ctx) => {
    const state = ctx.get('gameSessionState');
    // only pending games can be deleted
    if ((await state.getStatus().status) !== 'pending') {
      throw new LongGameError(
        LongGameError.Code.Forbidden,
        'Only pending games can be deleted.',
      );
    }
    await state.delete();
    // delete the invitations
    const userStore = ctx.get('userStore');
    await userStore.deleteAllGameSessionInvitations(ctx.get('gameSessionId'));
    return ctx.json({ success: true });
  })
  .get('/playerStatuses', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const playerStatuses = await state.getPlayerStatuses();
    return ctx.json(wrapRpcData(playerStatuses));
  })
  .post('/abandon', async (ctx) => {
    const state = ctx.get('gameSessionState');
    const userStore = ctx.get('userStore');
    const sessionId = ctx.get('gameSessionId');
    const playerId = ctx.get('session').userId;
    await state.abandonGame(playerId);
    // update the user's invitation
    await userStore.abandonGameSession(sessionId);
    return ctx.json({ success: true });
  });
