import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';

export const pushRouter = new Hono<Env>()
  .post(
    '/',
    userStoreMiddleware,
    zValidator(
      'json',
      z.object({
        endpoint: z.string(),
        keys: z.object({
          auth: z.string(),
          p256dh: z.string(),
        }),
        expirationTime: z.number().optional(),
      }),
    ),
    async (ctx) => {
      const { endpoint, keys, expirationTime } = ctx.req.valid('json');
      await ctx.get('userStore').createPushSubscription({
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        expirationTime: expirationTime ? new Date(expirationTime) : undefined,
      });
      return ctx.json({ success: true });
    },
  )
  .delete(
    '/:endpoint',
    userStoreMiddleware,
    zValidator(
      'param',
      z.object({
        endpoint: z.string(),
      }),
    ),
    async (ctx) => {
      const { endpoint } = ctx.req.valid('param');
      await ctx.get('userStore').deletePushSubscription(endpoint);
      return ctx.json({ success: true });
    },
  );
