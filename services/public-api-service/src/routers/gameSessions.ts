import { zValidator } from '@hono/zod-validator';
import { isPrefixedId } from '@long-game/db';
import { Hono } from 'hono';
import { z } from 'zod';
import { userStoreMiddleware } from '../../../common/middleware/session';
import { EnvWith } from '../config/ctx';

export const gameSessionsRouter = new Hono<EnvWith<'session'>>()
  .use(userStoreMiddleware)
  .get('/list', async (ctx) => {
    const sessions = await ctx.get('userStore').getGameSessions();
    return ctx.json(sessions);
  })
  .get(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.custom((v) => isPrefixedId(v, 'gs')),
      }),
    ),
    async (ctx) => {
      const { id } = ctx.req.valid('param');
      const session = await ctx.get('userStore').getGameSession(id);
      return ctx.json(session);
    },
  )
  .post(
    '/prepare',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const { gameId } = ctx.req.valid('json');
      const session = await ctx.get('userStore').prepareGameSession({ gameId });
      return ctx.json(session);
    },
  )
  .post(
    '/update',
    zValidator(
      'json',
      z.object({
        id: z.custom((v) => isPrefixedId(v, 'gs')),
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const { id, gameId } = ctx.req.valid('json');
      const session = await ctx
        .get('userStore')
        .updateGameSession({ id, gameId });
      return ctx.json(session);
    },
  )
  .post(
    '/start',
    zValidator(
      'json',
      z.object({
        id: z.custom((v) => isPrefixedId(v, 'gs')),
      }),
    ),
    async (ctx) => {
      const { id } = ctx.req.valid('json');
      const session = await ctx.get('userStore').startGameSession(id);
      const members = await ctx.get('userStore').getGameSessionMembers(id);

      // initialize the game session state durable object
      const durableObjectId = ctx.env.GAME_SESSION_STATE.idFromName(id);
      const sessionState = ctx.env.GAME_SESSION_STATE.get(durableObjectId);
      await sessionState.initialize({
        ...session,
        startedAt: session.startedAt
          ? new Date(await session.startedAt.getTime())
          : null,
        endedAt: session.endedAt
          ? new Date(await session.endedAt.getTime())
          : null,
        members: members.map((m) => ({ id: m.userId })),
      });

      return ctx.json(session);
    },
  );
