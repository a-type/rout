import { zValidator } from '@hono/zod-validator';
import { idShapes } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../config/ctx';

export const adminGameSessionsRouter = new Hono<Env>()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        before: z.string().optional(),
        first: z.number().optional(),
        status: z.enum(['active', 'complete', 'pending']).optional(),
      }),
    ),
    async (ctx) => {
      const { before, first, status } = ctx.req.valid('query');
      const sessions = await ctx.env.ADMIN_STORE.listAllGameSessions({
        before,
        first,
        status,
      });
      return ctx.json(sessions);
    },
  )
  .delete(
    '/:sessionId',
    zValidator('param', z.object({ sessionId: idShapes.GameSession })),
    async (ctx) => {
      const sessionId = ctx.req.valid('param').sessionId;
      const doId = ctx.env.GAME_SESSION.idFromName(sessionId);
      const gameSession = ctx.env.GAME_SESSION.get(doId);
      await gameSession.delete();
      await ctx.env.ADMIN_STORE.deleteGameSession(sessionId);
      return ctx.json({ ok: true });
    },
  );
