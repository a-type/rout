import { assert } from '@a-type/utils';
import { colorNames, LongGameError, PlayerColorName } from '@long-game/common';
import { z } from 'zod';
import { builder } from '../builder.js';
import { assignTypeName, hasTypeName } from '../relay.js';

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

      try {
        return assignTypeName('User')(
          await ctx.dataLoaders.user.load(ctx.session.userId),
        );
      } catch (err) {
        console.error(err);
        if (
          LongGameError.isInstance(err) &&
          err.code === LongGameError.Code.NotFound
        ) {
          // the user no longer exists in the db for this session. reset the session.
          await ctx.auth.setLoginSession(null);
          throw new LongGameError(
            LongGameError.Code.SessionInvalid,
            'You must be logged in to access this functionality.',
          );
        }

        throw err;
      }
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
            color: z.enum(colorNames),
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
          color: input.color || undefined,
        })
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      return userId;
    },
  }),
}));

export const User = builder.loadableNodeRef('User', {
  load: async (ids, ctx) => {
    return ctx.dataLoaders.user.loadMany(ids);
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
    email: t.field({
      type: 'String',
      resolve: (user, _, ctx) => {
        if (ctx.session?.userId === user.id) {
          return user.email;
        }
        return null;
      },
    }),
    imageUrl: t.exposeString('imageUrl'),
    color: t.field({
      type: UserColor,
      resolve: (user) => (user.color as PlayerColorName) || 'gray',
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
    color: t.field({ type: UserColor, required: true }),
  }),
});

const UserColor = builder.enumType('UserColor', {
  values: colorNames,
});
