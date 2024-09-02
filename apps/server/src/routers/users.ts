import { Hono } from 'hono';
import { Env } from '../config/ctx.js';
import { loggedInMiddleware } from '../middleware/session.js';
import { LongGameError } from '@long-game/common';
import { db, userNameSelector } from '@long-game/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const usersRouter = new Hono<Env>()
  .get('/me', loggedInMiddleware, async (ctx) => {
    const { userId } = ctx.get('session');
    const user = await db
      .selectFrom('User')
      .where('id', '=', userId)
      .select(['id', 'color'])
      .select(userNameSelector)
      .executeTakeFirst();
    if (!user) {
      throw new LongGameError(LongGameError.Code.NotFound, 'User not found');
    }
    return ctx.json(user);
  })
  .put(
    '/me',
    loggedInMiddleware,
    zValidator(
      'json',
      z.object({
        color: z.string().optional(),
        name: z.string().max(255).optional(),
      }),
    ),
    async (ctx) => {
      const { userId } = ctx.get('session');
      const { color, name } = ctx.req.valid('json');
      const user = await db
        .updateTable('User')
        .set({ color, friendlyName: name })
        .where('id', '=', userId)
        .returning(['id', 'color'])
        .returning(userNameSelector)
        .execute();
      return ctx.json(user);
    },
  );
