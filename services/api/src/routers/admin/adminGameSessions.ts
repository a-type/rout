import { zValidator } from '@hono/zod-validator';
import { idShapes, LongGameError, wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../config/ctx.js';

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
  )
  .get(
    '/:sessionId/db',
    zValidator('param', z.object({ sessionId: idShapes.GameSession })),
    async (ctx) => {
      const sessionId = ctx.req.valid('param').sessionId;
      const doId = ctx.env.GAME_SESSION.idFromName(sessionId);
      const gameSession = ctx.env.GAME_SESSION.get(doId);

      // dumps are often too large for the RPC data limit,
      // so use fetch to retrieve it
      const proxiedUrl = new URL(ctx.req.url);
      proxiedUrl.pathname = '/dump';
      const proxiedRequest = new Request(proxiedUrl, {
        method: 'GET',
        headers: {
          Authorization: ctx.req.header('Authorization') ?? '',
        },
      });
      return gameSession.fetch(proxiedRequest);
    },
  )
  .get(
    '/:sessionId/details',
    zValidator('param', z.object({ sessionId: idShapes.GameSession })),
    async (ctx) => {
      const sessionId = ctx.req.valid('param').sessionId;
      const doId = ctx.env.GAME_SESSION.idFromName(sessionId);
      const session = await ctx.env.GAME_SESSION.get(doId);
      if (!session) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'Game session not found',
        );
      }
      const details = await session.getDetails();
      return ctx.json(wrapRpcData(details));
    },
  )
  .put(
    '/:sessionId/timezone',
    zValidator('param', z.object({ sessionId: idShapes.GameSession })),
    zValidator(
      'json',
      z.object({
        timezone: z.string(),
      }),
    ),
    async (ctx) => {
      const sessionId = ctx.req.valid('param').sessionId;
      const doId = ctx.env.GAME_SESSION.idFromName(sessionId);
      const { timezone } = ctx.req.valid('json');
      const gameSession = ctx.env.GAME_SESSION.get(doId);
      await gameSession.updateTimezone(timezone);
      return ctx.json({ ok: true });
    },
  );
