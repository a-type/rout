import { assert } from '@a-type/utils';
import { builder } from '../builder.js';
import { z } from 'zod';
import { id } from '@long-game/db';
import { assignTypeName } from '../relay.js';
import { LongGameError } from '@long-game/common';
import { GQLContext } from '../context.js';
import {
  ChatMessageSentEvent,
  EVENT_LABELS,
  pubsub,
} from '../../services/pubsub.js';
import { withFilter } from 'graphql-subscriptions';

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

builder.subscriptionFields((t) => ({
  chatMessageSent: t.field({
    type: 'ChatMessage',
    authScopes: {
      user: true,
    },
    args: {
      gameSessionId: t.arg({
        type: 'ID',
        required: true,
      }),
    },
    subscribe: async (_, args, ctx) => {
      assert(ctx.session);
      // authorize game session access first
      await ctx.db
        .selectFrom('GameSessionMembership')
        .where('gameSessionId', '=', args.gameSessionId)
        .where('userId', '=', ctx.session.userId)
        .select(['id'])
        .executeTakeFirstOrThrow(
          () => new LongGameError(LongGameError.Code.Forbidden),
        );

      const iterator = pubsub.asyncIterator(
        EVENT_LABELS.chatMessageSent(args.gameSessionId),
      );

      return iterator as any;
    },
    resolve: async (root: ChatMessageSentEvent) => {
      return assignTypeName('ChatMessage')(root.message);
    },
  }),
}));

export const ChatMessage = builder.node('ChatMessage', {
  fields: (t) => ({
    message: t.exposeString('message', {
      nullable: false,
    }),
    userId: t.exposeString('userId', {
      nullable: false,
    }),
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
