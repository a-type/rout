import { zValidator } from '@hono/zod-validator';
import { LongGameError } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx.js';

export const publicRouter = new Hono<Env>().get(
  '/publicInviteGameInfo/:code',
  zValidator(
    'param',
    z.object({
      code: z.string(),
    }),
  ),
  async (ctx) => {
    const { code } = ctx.req.valid('param');
    const gameSessionId =
      await ctx.env.PUBLIC_STORE.getGameSessionIdFromInvitationCode(code);
    if (!gameSessionId) {
      throw new LongGameError(LongGameError.Code.NotFound, 'Invite not found.');
    }
    const durableObjectId = ctx.env.GAME_SESSION.idFromName(gameSessionId);
    const sessionState = await ctx.env.GAME_SESSION.get(durableObjectId);
    if (!sessionState.getIsInitialized()) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Game session not found.',
      );
    }
    const summary = await sessionState.getDetails();
    return ctx.json({
      gameSessionId,
      gameId: summary.gameId,
      gameVersion: summary.gameVersion,
      status: summary.status,
    });
  },
);
