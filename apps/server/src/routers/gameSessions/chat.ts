import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, id } from '@long-game/db';
import { LongGameError } from '@long-game/common';
import { Env } from '../../config/ctx.js';

const PAGE_SIZE = 100;

export const chatRouter = new Hono<Env>()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        before: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const gameSessionId = ctx.get('gameSessionId');
      const before = ctx.req.valid('query').before;

      let messagesBuilder = db
        .selectFrom('ChatMessage')
        .where('gameSessionId', '=', gameSessionId);

      if (before) {
        messagesBuilder = messagesBuilder.where('createdAt', '<', before);
      }

      const messages = await messagesBuilder
        .select(['id', 'createdAt', 'updatedAt', 'userId', 'message'])
        .limit(PAGE_SIZE)
        .orderBy('createdAt', 'asc')
        .execute();

      return ctx.json({
        messages,
      });
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        message: z.string().max(1000),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      if (!session) {
        throw new LongGameError(
          LongGameError.Code.Unauthorized,
          'You must be logged in to send messages.',
        );
      }
      const { userId } = session;
      const gameSessionId = ctx.get('gameSessionId');
      const { message } = ctx.req.valid('json');

      // validate game session access
      const membership = await db
        .selectFrom('GameSessionMembership')
        .where('gameSessionId', '=', gameSessionId)
        .where('userId', '=', userId)
        .select(['id'])
        .executeTakeFirst();

      if (!membership) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'Could not find that game session. Are you logged in?',
        );
      }

      const chatMessage = await db
        .insertInto('ChatMessage')
        .values({
          id: id(),
          gameSessionId,
          userId,
          message,
        })
        .returningAll()
        .executeTakeFirst();

      return ctx.json(chatMessage);
    },
  );
