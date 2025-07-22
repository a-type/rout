import { zValidator } from '@hono/zod-validator';
import { idShapes, wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../config/ctx.js';

export const adminUsersRouter = new Hono<Env>()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        before: z.string().optional(),
        first: z.coerce.number().int().min(1).max(100).default(20),
      }),
    ),
    async (ctx) => {
      const page = await ctx.env.ADMIN_STORE.listUsers(ctx.req.valid('query'));
      return ctx.json(wrapRpcData(page));
    },
  )
  .delete(
    '/:userId',
    zValidator('param', z.object({ userId: idShapes.User })),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      await ctx.env.ADMIN_STORE.deleteUser(userId);
      return ctx.json({ success: true });
    },
  );
