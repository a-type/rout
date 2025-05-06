import { zValidator } from '@hono/zod-validator';
import { assertPrefixedId } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { verifySocketToken } from '../auth/socketTokens';
import { Env } from '../config/ctx';

export const socketRouter = new Hono<Env>().all(
  '/',
  zValidator(
    'query',
    z.object({
      token: z.string(),
    }),
  ),
  async (ctx) => {
    const { aud: gameSessionId, sub: userId } = await verifySocketToken(
      ctx.req.valid('query').token,
      ctx.env.SOCKET_TOKEN_SECRET,
    );
    assertPrefixedId(gameSessionId, 'gs');

    const state = await ctx.env.GAME_SESSION.get(
      await ctx.env.GAME_SESSION.idFromName(gameSessionId),
    );
    return state.fetch(ctx.req.raw);
  },
);
