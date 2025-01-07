import { Hono } from 'hono';
import { userStoreMiddleware } from '../../../common/middleware/session';

export const gameSessionMembershipsRouter = new Hono()
  .use(userStoreMiddleware)
  .get('/list', async (ctx) => {
    const memberships = await ctx.get('userStore').getGameSessions();
    return ctx.json(memberships);
  });
