import { zValidator } from '@hono/zod-validator';
import { id, LongGameError } from '@long-game/common';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { Hono } from 'hono';
import { z } from 'zod';
import { userStoreMiddleware } from '../../middleware';
import { EnvWith } from '../config/ctx';
import { getGameSessionState } from '../services/gameSessions';

import { gameSessionRouter } from './gameSession';

export const gameSessionsRouter = new Hono<EnvWith<'session'>>()
  .use(userStoreMiddleware)
  .get('/', async (ctx) => {
    const userStore = ctx.get('userStore');
    const sessions = await userStore.getGameSessions();

    const sessionDOs = await Promise.allSettled(
      sessions.map(async ({ gameSessionId }) => {
        const state = await getGameSessionState(gameSessionId, ctx.env);
        return await state.getSummary();
      }),
    );

    const sessionStates = sessionDOs
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const errors = sessionDOs
      .map((r) => (r.status === 'rejected' ? r.reason : null))
      .filter((e): e is Error => e !== null);

    for (const err of errors) {
      console.error(err);
    }

    return ctx.json({
      sessions: sessionStates,
      errors: errors.map((e) => e?.message),
    });
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
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

      const sessionId = id('gs');
      const durableObjectId = ctx.env.GAME_SESSION_STATE.idFromName(sessionId);
      const sessionState = await ctx.env.GAME_SESSION_STATE.get(
        durableObjectId,
      );
      const randomSeed = crypto.randomUUID();
      const userId = ctx.get('session').userId;
      await sessionState.initialize({
        id: sessionId,
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

      // insert founding membership so the user can find this session
      const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(userId);
      await userStore.insertFoundingGameMembership(sessionId);

      return ctx.json({ sessionId });
    },
  )
  .all('/:id/socket', async (ctx) => {
    const state = ctx.env.GAME_SESSION_STATE.get(
      ctx.env.GAME_SESSION_STATE.idFromName(ctx.req.param('id')),
    );
    return state.fetch(ctx.req.raw);
  })
  .route('/:id', gameSessionRouter);
