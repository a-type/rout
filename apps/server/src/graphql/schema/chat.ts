import { assert } from '@a-type/utils';
import { builder } from '../builder.js';
import { z } from 'zod';
import { id } from '@long-game/db';
import { assignTypeName } from '../relay.js';
import { LongGameError } from '@long-game/common';

builder.mutationFields((t) => ({
  sendMessage: t.field({
    type: 'ChatMessage',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'SendChatMessageInput',
        required: true,
        validate: {
          schema: z.object({
            gameSessionId: z.string(),
            message: z.string(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);

      // validate game session access
      const membership = await ctx.db
        .selectFrom('GameSessionMembership')
        .where('gameSessionId', '=', input.gameSessionId)
        .where('userId', '=', ctx.session.userId)
        .select(['id'])
        .executeTakeFirst();

      if (!membership) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'Could not find that game session. Are you logged in?',
        );
      }

      const chatMessage = await ctx.db
        .insertInto('ChatMessage')
        .values({
          id: id(),
          gameSessionId: input.gameSessionId,
          message: input.message,
          userId: ctx.session.userId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return assignTypeName('ChatMessage')(chatMessage);
    },
  }),
}));

export const ChatMessage = builder.node('ChatMessage', {
  fields: (t) => ({
    message: t.exposeString('message'),
    userId: t.exposeString('userId'),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (obj) => new Date(obj.createdAt),
      nullable: false,
    }),
  }),
  id: {
    resolve: (obj) => obj.id,
  },
});

builder.inputType('SendChatMessageInput', {
  fields: (t) => ({
    gameSessionId: t.string({
      required: true,
    }),
    message: t.string({
      required: true,
    }),
  }),
});
