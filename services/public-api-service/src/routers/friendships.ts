import { zValidator } from '@hono/zod-validator';
import { assertPrefixedId } from '@long-game/db';
import { Hono } from 'hono';
import { z } from 'zod';
import { userStoreMiddleware } from '../../../common/middleware/session';
import { Env } from '../config/ctx';

export const friendshipsRouter = new Hono<Env>()
  .use(userStoreMiddleware)
  .get(
    '/list',
    zValidator(
      'query',
      z.object({
        status: z.enum(['pending', 'accepted', 'declined']).optional(),
      }),
    ),
    async (ctx) => {
      const friendships = await ctx.get('userStore').getFriendships({
        status: ctx.req.valid('query').status,
      });

      return ctx.json(friendships);
    },
  )
  .post(
    '/create',
    zValidator('json', z.object({ email: z.string() })),
    async (ctx) => {
      const { email } = ctx.req.valid('json');
      await ctx.get('userStore').sendFriendshipInvite(email);
      return ctx.json({ success: true });
    },
  )
  .post(
    '/respond/:id',
    zValidator(
      'json',
      z.object({ response: z.enum(['accepted', 'declined']) }),
    ),
    async (ctx) => {
      const { response } = ctx.req.valid('json');
      const id = ctx.req.param('id');
      assertPrefixedId(id, 'f');
      await ctx.get('userStore').respondToFriendshipInvite(id, response);
      return ctx.json({ success: true });
    },
  );
