import { zValidator } from '@hono/zod-validator';
import { isPrefixedId, wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { userStoreMiddleware } from '../../middleware';

export const gameSessionInvitationsRouter = new Hono()
  .use(userStoreMiddleware)
  .get('/', async (ctx) => {
    const invitations = await ctx
      .get('userStore')
      .getGameSessionInvitations('pending');
    return ctx.json(wrapRpcData(invitations));
  })
  .put(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.custom((v) => isPrefixedId(v, 'gsi')),
      }),
    ),
    zValidator(
      'json',
      z.object({
        response: z.enum(['accepted', 'declined']),
      }),
    ),
    async (ctx) => {
      const { id } = ctx.req.valid('param');
      const { response } = ctx.req.valid('json');
      await ctx.get('userStore').respondToGameSessionInvitation(id, response);
      return ctx.json({ success: true });
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gameSessionId: z.custom((v) => isPrefixedId(v, 'gs')),
        userId: z.custom((v) => isPrefixedId(v, 'u')),
      }),
    ),
    async (ctx) => {
      const { gameSessionId, userId } = ctx.req.valid('json');
      await ctx
        .get('userStore')
        .sendGameSessionInvitation(gameSessionId, userId);
      return ctx.json({ success: true });
    },
  );
