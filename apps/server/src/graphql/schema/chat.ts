import { assert } from '@a-type/utils';
import { id } from '@long-game/db';
import { decodeGlobalID } from '@pothos/plugin-relay';
import { z } from 'zod';
import { validateAccessToGameSession } from '../../data/gameSession.js';
import {
  ChatMessageSentEvent,
  EVENT_LABELS,
  pubsub,
} from '../../services/pubsub.js';
import { builder } from '../builder.js';
import { assignTypeName } from '../relay.js';

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
      const gameSessionId = decodeGlobalID(input.gameSessionId).id;

      await validateAccessToGameSession(gameSessionId, ctx.session);

      const chatMessage = await ctx.db
        .insertInto('ChatMessage')
        .values({
          id: id(),
          gameSessionId: gameSessionId,
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
      gameSessionId: t.arg.globalID({
        required: true,
      }),
    },
    subscribe: async (_, args, ctx) => {
      assert(ctx.session);
      await validateAccessToGameSession(args.gameSessionId.id, ctx.session);

      const iterator = pubsub.asyncIterator(
        EVENT_LABELS.chatMessageSent(args.gameSessionId.id),
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
