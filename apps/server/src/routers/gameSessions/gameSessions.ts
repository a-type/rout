import { Hono } from 'hono';
import { Env } from '../../config/ctx.js';
import { chatRouter } from './chat.js';
import { eventsRouter } from './events.js';
import { gameSessionRouter } from './gameSession.js';
import { membershipsRouter } from './memberships.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { LongGameError } from '@long-game/common';
import { db, id } from '@long-game/db';
import { getLatestVersion } from '@long-game/game-definition';

export const gameSessionsRouter = new Hono<Env>()
  .use('/:gameSessionId', (ctx, next) => {
    ctx.set('gameSessionId', ctx.req.param('gameSessionId'));
    return next();
  })
  .route('/:gameSessionId/events', eventsRouter)
  .route('/:gameSessionId/chat', chatRouter)
  .route('/:gameSessionId', gameSessionRouter)
  .route('/memberships', membershipsRouter)
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      if (!session) {
        throw new LongGameError(
          LongGameError.Code.Unauthorized,
          'You must be logged in to create a game session.',
        );
      }

      const game = ctx.req.valid('json');
      const gameSession = await db.transaction().execute(async (db) => {
        const gameSession = await db
          .insertInto('GameSession')
          .values({
            id: id(),
            gameId: game.gameId,
            gameVersion: getLatestVersion(game).version,
            // TODO: configurable + automatic detection?
            timezone: 'America/New_York',
            initialState: {},
            randomSeed: id(),
          })
          .returning(['id', 'gameId', 'createdAt'])
          .executeTakeFirstOrThrow();

        // seed own membership
        await db
          .insertInto('GameSessionMembership')
          .values({
            id: id(),
            gameSessionId: gameSession.id,
            userId: session.userId,
            inviterId: session.userId,
            status: 'accepted',
          })
          .execute();

        return gameSession;
      });

      return ctx.json(gameSession);
    },
  );
