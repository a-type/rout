import { LongGameError } from '@long-game/common';
import { Hono } from 'hono';
import { userStoreMiddleware } from '../../../common/middleware/session';
import { Env } from '../config/ctx';

export const usersRouter = new Hono<Env>().get(
  '/me',
  userStoreMiddleware,
  async (ctx) => {
    const user = await ctx.get('userStore').getSession();
    if (!user) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'User not found',
      );
    }
    // return ctx.json(user as { id: string; name: string });
    return ctx.json(user);
  },
);
