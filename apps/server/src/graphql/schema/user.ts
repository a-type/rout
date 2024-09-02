import { LongGameError } from '@long-game/common';
import { builder } from '../builder.js';
import { userNameSelector } from '@long-game/db';
import { assignTypeName, hasTypeName } from '../relay.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import type { User as DBUser } from '@long-game/db';
import { assert } from '@a-type/utils';
import { z } from 'zod';

builder.queryField('me', (t) =>
  t.field({
    type: User,
    nullable: false,
    resolve: async (_, __, ctx) => {
      if (!ctx.session?.userId) {
        throw new LongGameError(
          LongGameError.Code.Unauthorized,
          'You must be logged in to access this functionality.',
        );
      }

      return ctx.session.userId;
    },
  }),
);

builder.mutationFields((t) => ({
  acceptTermsOfService: t.field({
    type: User,
    authScopes: {
      user: true,
    },
    resolve: async (_, __, ctx) => {
      assert(ctx.session);
      const userId = ctx.session.userId;
      await ctx.db
        .updateTable('User')
        .set({
          acceptedTosAt: new Date(),
        })
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      return userId;
    },
  }),
  setSendEmailUpdates: t.field({
    type: User,
    authScopes: {
      user: true,
    },
    args: {
      value: t.arg({ type: 'Boolean', required: true }),
    },
    resolve: async (_, { value }, ctx) => {
      assert(ctx.session);
      const userId = ctx.session.userId;
      await ctx.db
        .updateTable('User')
        .set({
          sendEmailUpdates: value,
        })
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      return userId;
    },
  }),
  updateUserInfo: t.field({
    type: User,
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'UpdateUserInfoInput',
        required: true,
        validate: {
          schema: z.object({
            name: z.string().max(255).nullable().optional(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const userId = ctx.session.userId;
      await ctx.db
        .updateTable('User')
        .set({
          friendlyName: input.name || undefined,
        })
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      return userId;
    },
  }),
}));

export const User = builder.loadableNodeRef('User', {
  load: async (ids, ctx) => {
    const users = await ctx.db
      .selectFrom('User')
      .where('id', 'in', ids)
      .selectAll()
      .execute();

    const indexes = keyIndexes(ids);

    const results = createResults<DBUser & { __typename: 'User' }>(ids);
    for (const result of users) {
      results[indexes[result.id]] = assignTypeName('User')(result);
    }

    return results;
  },
  id: {
    resolve: (user) => user.id,
  },
});

User.implement({
  description: 'A user of Long Game',
  isTypeOf: hasTypeName('User'),
  fields: (t) => ({
    name: t.string({
      resolve: (user) => user.friendlyName || user.fullName || 'Anonymous',
      nullable: false,
    }),
    email: t.exposeString('email', {
      nullable: false,
    }),
    imageUrl: t.exposeString('imageUrl'),
    color: t.field({
      type: 'String',
      resolve: (user) => user.color || 'gray',
      nullable: false,
    }),
    isViewer: t.field({
      type: 'Boolean',
      nullable: false,
      resolve: (user, _, ctx) => {
        return ctx.session?.userId === user.id;
      },
    }),
  }),
});

builder.inputType('UpdateUserInfoInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
  }),
});
