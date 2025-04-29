import { wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { Env } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';

export const gamesRouter = new Hono<Env>()
  .use(userStoreMiddleware)
  // basically useful for correcting a lack of free games which should be
  // provided on signup
  .post('/applyFree', async (ctx) => {
    const session = ctx.get('session');
    const userId = session.userId;
    await ctx.env.ADMIN_STORE.applyFreeGames(userId);
    return ctx.json({ success: true });
  })
  .get('/owned', async (ctx) => {
    const gameIds = await ctx.get('userStore').getOwnedGames();
    return ctx.json(wrapRpcData(gameIds));
  });
