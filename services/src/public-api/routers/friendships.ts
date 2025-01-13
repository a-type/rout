import { zValidator } from '@hono/zod-validator';
import { assertPrefixedId, wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { userStoreMiddleware } from '../../middleware';
import { Env } from '../config/ctx';

export const friendshipsRouter = new Hono<Env>()
  .use(userStoreMiddleware)
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        status: z.enum(['pending', 'accepted', 'declined']).optional(),
      }),
    ),
    async (ctx) => {
      const friendships = await ctx.get('userStore').getFriendships();
      return ctx.json(wrapRpcData(friendships));
    },
  )
  .get('/invites', async (ctx) => {
    const friendships = await ctx.get('userStore').getFriendshipInvites({
      direction: 'incoming',
    });
    return ctx.json(wrapRpcData(friendships));
  })
  .get('/requests', async (ctx) => {
    const friendships = await ctx.get('userStore').getFriendshipInvites({
      direction: 'outgoing',
    });
    return ctx.json(wrapRpcData(friendships));
  })
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
