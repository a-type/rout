import { db, id } from '@long-game/db';
import { router, userProcedure } from './util.js';
import * as zod from 'zod';
import { TRPCError } from '@trpc/server';

const PAGE_SIZE = 100;

export const chatRouter = router({
  /** Fetches a page of chats. Omit before to fetch latest. */
  getPage: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
        before: zod.string().optional(),
      }),
    )
    .query(async (opts) => {
      let messagesBuilder = db
        .selectFrom('ChatMessage')
        .where('gameSessionId', '=', opts.input.gameSessionId);

      if (opts.input.before) {
        messagesBuilder = messagesBuilder.where(
          'createdAt',
          '<',
          opts.input.before,
        );
      }

      const messages = await messagesBuilder
        .select(['id', 'createdAt', 'updatedAt', 'userId', 'message'])
        .limit(PAGE_SIZE)
        .orderBy('createdAt', 'asc')
        .execute();

      return {
        messages,
      };
    }),

  send: userProcedure
    .input(
      zod.object({
        gameSessionId: zod.string(),
        message: zod.string().max(1000),
      }),
    )
    .mutation(async (opts) => {
      const { userId } = opts.ctx.session;
      const { gameSessionId, message } = opts.input;

      // validate game session access
      const membership = await db
        .selectFrom('GameSessionMembership')
        .where('gameSessionId', '=', gameSessionId)
        .where('userId', '=', userId)
        .select(['id'])
        .executeTakeFirst();

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game session not found',
        });
      }

      const [chat] = await db
        .insertInto('ChatMessage')
        .values({
          id: id(),
          userId,
          gameSessionId,
          message,
        })
        .returningAll()
        .execute();

      opts.ctx.events.sendChat(gameSessionId, chat);

      return {};
    }),
});
