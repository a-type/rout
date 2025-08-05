import { zValidator } from '@hono/zod-validator';
import { LongGameError } from '@long-game/common';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { Hono } from 'hono';
import { z } from 'zod';
import { EnvWith } from '../config/ctx.js';
import { userStoreMiddleware } from '../middleware/index.js';

import { gameSessionRouter } from './gameSession.js';

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
          .preprocess(
            (val) => {
              if (Array.isArray(val)) {
                return val;
              }
              if (typeof val === 'string') {
                return [val];
              }
              return undefined;
            },
            z.enum(['active', 'complete', 'pending', 'abandoned']).array(),
          )
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
        gameId: z.string().optional(),
      }),
    ),
    userStoreMiddleware,
    async (ctx) => {
      const { gameId } = ctx.req.valid('json');
      let gameVersion: string | undefined;
      if (gameId) {
        const game = games[gameId];

        if (!game) {
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            'Game not found',
          );
        }
        const gameDefinition = getLatestVersion(game);
        gameVersion = gameDefinition.version;
      }

      const userStore = ctx.get('userStore');
      const gameSession = await userStore.createGameSession(
        gameId,
        gameVersion,
      );

      const durableObjectId = ctx.env.GAME_SESSION.idFromName(gameSession.id);
      const sessionState = await ctx.env.GAME_SESSION.get(durableObjectId);
      const randomSeed = crypto.randomUUID();
      const me = await userStore.getMe();
      await sessionState.initialize({
        id: gameSession.id,
        randomSeed,
        gameId,
        gameVersion,
        members: [
          {
            id: me.id,
            displayName: me.displayName,
            color: me.color,
          },
        ],
        // TODO: configurable / automatic detection
        timezone: 'America/New_York',
        createdBy: me.id,
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
