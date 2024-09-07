import { assert } from '@a-type/utils';
import { id, isPrefixedId, PrefixedId } from '@long-game/db';
import { z } from 'zod';
import { validateAccessToGameSession } from '../../data/gameSession.js';
import {
  ChatMessageSentEvent,
  EVENT_LABELS,
  pubsub,
} from '../../services/pubsub.js';
import { builder } from '../builder.js';
import { User } from './user.js';
import { encodeBase64 } from '@pothos/core';
import {
  resolveCursorConnection,
  ResolveCursorConnectionArgs,
} from '@pothos/plugin-relay';

builder.mutationFields((t) => ({
  sendMessage: t.field({
    type: 'SendChatMessageResult',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'SendChatMessageInput',
        required: true,
        validate: {
          schema: z.object({
            gameSessionId: z.custom<PrefixedId<'gs'>>((v) =>
              isPrefixedId(v, 'gs'),
            ),
            message: z.string(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const gameSessionId = input.gameSessionId;

      await validateAccessToGameSession(gameSessionId, ctx.session);

      const chatMessage = await ctx.db
        .insertInto('ChatMessage')
        .values({
          id: id('cm'),
          gameSessionId: gameSessionId,
          message: input.message,
          userId: ctx.session.userId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      pubsub.publishChatMessageSent({
        message: chatMessage,
      });

      return {
        message: chatMessage,
      };
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
      gameSessionId: t.arg.prefixedId({
        required: true,
        prefix: 'gs',
      }),
    },
    subscribe: async (_, args, ctx) => {
      assert(ctx.session);
      await validateAccessToGameSession(args.gameSessionId, ctx.session);

      const iterator = pubsub.events.asyncIterator(
        EVENT_LABELS.chatMessageSent(args.gameSessionId),
      );

      return iterator as any;
    },
    resolve: async (root: ChatMessageSentEvent) => {
      return root.message;
    },
  }),
}));

export const ChatMessage = builder.node('ChatMessage', {
  fields: (t) => ({
    message: t.exposeString('message', {
      nullable: false,
    }),
    userId: t.id({
      resolve: (obj) => obj.userId,
      nullable: false,
    }),
    user: t.field({
      type: User,
      resolve: (obj) => obj.userId,
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

builder.node('GameChat', {
  id: {
    resolve: (obj) => `gc-${encodeBase64(obj.gameSessionId)}`,
  },
  fields: (t) => ({
    messages: t.connection({
      type: ChatMessage,
      nullable: false,
      resolve: (root, args, ctx) =>
        resolveCursorConnection(
          {
            args,
            toCursor: (message) => message.createdAt,
          },
          async ({
            before,
            after,
            limit,
            inverted,
          }: ResolveCursorConnectionArgs) => {
            let messagesBuilder = ctx.db
              .selectFrom('ChatMessage')
              .where('gameSessionId', '=', root.gameSessionId);

            if (before) {
              messagesBuilder = messagesBuilder.where('createdAt', '<', before);
            } else if (after) {
              messagesBuilder = messagesBuilder.where('createdAt', '>', after);
            }

            const messages = await messagesBuilder
              .selectAll()
              .limit(limit)
              .orderBy('createdAt', inverted ? 'desc' : 'asc')
              .execute();

            return messages;
          },
        ),
    }),
  }),
});

builder.objectType('SendChatMessageResult', {
  fields: (t) => ({
    message: t.field({
      type: ChatMessage,
      nullable: false,
      resolve: (obj) => obj.message,
    }),
    gameChat: t.field({
      type: 'GameChat',
      resolve: (obj) => ({ gameSessionId: obj.message.gameSessionId }),
    }),
  }),
});

builder.inputType('SendChatMessageInput', {
  fields: (t) => ({
    gameSessionId: t.prefixedId({
      required: true,
    }),
    message: t.string({
      required: true,
    }),
  }),
});
