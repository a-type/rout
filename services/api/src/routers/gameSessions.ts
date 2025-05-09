import { zValidator } from '@hono/zod-validator';
import { LongGameError } from '@long-game/common';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { Hono } from 'hono';
import { z } from 'zod';
import { EnvWith } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';

import { gameSessionRouter } from './gameSession';

export const gameSessionsRouter = new Hono<EnvWith<'session'>>()
  .use(userStoreMiddleware)
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        invitationStatus: z
          .enum(['pending', 'accepted', 'declined', 'expired'])
          .optional(),
        status: z
          .preprocess((val) => {
            if (Array.isArray(val)) {
              return val;
            }
            if (typeof val === 'string') {
              return [val];
            }
            return undefined;
          }, z.enum(['active', 'complete', 'pending']).array())
          .optional(),
        first: z.coerce.number().int().positive().optional(),
        before: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const userStore = ctx.get('userStore');
      const { invitationStatus, status, first, before } =
        ctx.req.valid('query');
      const { results: filteredSessions, pageInfo } =
        await userStore.getGameSessions({
          status,
          invitationStatus,
          first,
          before,
        });

      return ctx.json({
        results: filteredSessions,
        pageInfo,
      });
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    userStoreMiddleware,
    async (ctx) => {
      const { gameId } = ctx.req.valid('json');
      const game = games[gameId];

      if (!game) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game not found',
        );
      }
      const gameDefinition = getLatestVersion(game);

      const userStore = ctx.get('userStore');
      const gameSession = await userStore.createGameSession();

      const durableObjectId = ctx.env.GAME_SESSION.idFromName(gameSession.id);
      const sessionState = await ctx.env.GAME_SESSION.get(durableObjectId);
      const randomSeed = crypto.randomUUID();
      const userId = ctx.get('session').userId;
      await sessionState.initialize({
        id: gameSession.id,
        randomSeed,
        gameId: game.id,
        gameVersion: gameDefinition.version,
        members: [
          {
            id: userId,
          },
        ],
        // TODO: configurable / automatic detection
        timezone: 'America/New_York',
      });

      return ctx.json({ sessionId: gameSession.id });
    },
  )
  .get('/remaining', userStoreMiddleware, async (ctx) => {
    return ctx.json({
      count: await ctx.get('userStore').getRemainingGameSessions(),
    });
  })
  .route('/:id', gameSessionRouter);
