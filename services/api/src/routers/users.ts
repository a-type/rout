import { zValidator } from '@hono/zod-validator';
import { isPrefixedId, LongGameError } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx';
import { sessionMiddleware, userStoreMiddleware } from '../middleware';

export const usersRouter = new Hono<Env>()
  .get('/me', sessionMiddleware, async (ctx) => {
    const session = ctx.get('session');
    if (!session) {
      return ctx.json(null);
    }

    const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(
      session.userId,
    );
    const user = await userStore.getMe();
    if (!user) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'User not found',
      );
    }
    return ctx.json(user);
  })
  .put(
    '/me',
    userStoreMiddleware,
    zValidator(
      'json',
      z.object({
        displayName: z.string().optional(),
        color: z.string().optional(),
        imageUrl: z.string().optional(),
        sendEmailUpdates: z.boolean().optional(),
      }),
    ),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const updated = await ctx.get('userStore').updateMe(body);
      return ctx.json(updated);
    },
  )
  .get(
    '/:id',
    userStoreMiddleware,
    zValidator(
      'param',
      z.object({
        id: z.custom((v) => isPrefixedId(v, 'u')),
      }),
    ),
    async (ctx) => {
      const id = ctx.req.valid('param').id;
      const userStore = ctx.get('userStore');
      const user = await userStore.getUser(id);
      if (!user) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'User not found',
        );
      }
      return ctx.json(user);
    },
  );
