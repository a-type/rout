import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import {
  Friendship as DBFriendship,
  id,
  isPrefixedId,
  PrefixedId,
} from '@long-game/db';
import { encodeBase64 } from '@pothos/core';
import { resolveOffsetConnection } from '@pothos/plugin-relay';
import { z } from 'zod';
import { builder } from '../builder.js';
import { GQLContext } from '../context.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import { assignTypeName } from '../relay.js';
import { User } from './user.js';

builder.queryFields((t) => ({
  friendships: t.field({
    type: 'Friendships',
    nullable: false,
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'FriendshipFilterInput',
        validate: {
          schema: z.object({
            status: z.enum(['pending', 'accepted', 'declined']),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      return {
        filter: input || {},
      };
    },
  }),
}));

builder.mutationFields((t) => ({
  sendFriendshipInvite: t.field({
    type: 'SendFriendshipInviteResult',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'SendFriendshipInviteInput',
        required: true,
        validate: {
          schema: z.object({
            email: z.string().email(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const { email } = input;

      const user = await ctx.db
        .selectFrom('User')
        .where('email', '=', email)
        .select(['id'])
        .executeTakeFirst();

      if (!user) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'No user found with that email',
        );
      }

      const [userId, friendId] = [ctx.session.userId, user.id].sort();

      const existing = await ctx.db
        .selectFrom('Friendship')
        .where('userId', '=', userId)
        .where('friendId', '=', friendId)
        .select(['status', 'id'])
        .executeTakeFirst();

      if (existing) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Friendship already exists',
        );
      }

      const friendship = await ctx.db
        .insertInto('Friendship')
        .values({
          id: id('f'),
          userId,
          friendId,
          initiatorId: ctx.session.userId,
          status: 'pending',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return {
        friendship: assignTypeName('Friendship')(friendship),
      };
    },
  }),
  respondToFriendshipInvite: t.field({
    type: 'FriendshipResponseResult',
    nullable: false,
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'FriendshipInviteResponseInput',
        required: true,
        validate: {
          schema: z.object({
            friendshipId: z.custom<PrefixedId<'f'>>((v) =>
              isPrefixedId(v, 'f'),
            ),
            response: z.enum(['accepted', 'declined']),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const { friendshipId, response } = input;
      const id = friendshipId;

      const friendship = await ctx.db
        .selectFrom('Friendship')
        .where('id', '=', id)
        .select(['status', 'userId', 'friendId'])
        .executeTakeFirst();

      if (!friendship) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'No friendship found with that id',
        );
      }

      if (
        friendship.friendId !== ctx.session.userId &&
        friendship.userId !== ctx.session.userId
      ) {
        throw new LongGameError(
          LongGameError.Code.Forbidden,
          'You are not a part of this friendship',
        );
      }

      if (friendship.status !== 'pending') {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Friendship invite is not pending',
        );
      }

      const result = await ctx.db
        .updateTable('Friendship')
        .set({
          status: response,
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      return {
        friendship: assignTypeName('Friendship')(result),
      };
    },
  }),
}));

// OUTPUT TYPES
export const Friendship = builder.loadableNodeRef('Friendship', {
  load: async (ids, ctx) => {
    if (!ctx.session) {
      // can't view friendships without logging in
      return createResults(ids);
    }

    // parse the ids down to userId and friendId
    // and query db for each ID that isn't the
    // user's own ID
    const { userId } = ctx.session;

    const friendships = await ctx.db
      .selectFrom('Friendship')
      .where(
        'Friendship.id',
        'in',
        ids.filter((id) => isPrefixedId(id, 'f')),
      )
      .where((eb) =>
        eb.or([
          eb('Friendship.userId', '=', userId),
          eb('Friendship.friendId', '=', userId),
        ]),
      )
      .selectAll()
      .execute();

    const indexes = keyIndexes(ids);

    const results = createResults<DBFriendship>(ids);

    for (const friendship of friendships) {
      results[indexes[friendship.id]] = friendship;
    }

    return results;
  },
  id: {
    resolve: (obj) => obj.id,
  },
});
Friendship.implement({
  fields: (t) => ({
    status: t.field({
      type: FriendshipStatus,
      resolve: (friendship) => friendship.status,
    }),
    friend: t.field({
      type: User,
      resolve: (friendship, _, ctx) => {
        if (friendship.friendId === ctx.session?.userId) {
          return friendship.userId;
        } else {
          return friendship.friendId;
        }
      },
      nullable: false,
    }),
  }),
});

const FriendshipStatus = builder.enumType('FriendshipStatus', {
  values: ['pending', 'accepted', 'declined'],
});

builder.node('Friendships', {
  id: {
    resolve: (obj) => encodeBase64(obj.filter.status || 'all'),
  },
  fields: (t) => ({
    connection: t.connection({
      type: Friendship,
      resolve: async (obj, args, ctx) => {
        return resolveOffsetConnection({ args }, ({ limit, offset }) => {
          return getFriendships(ctx, obj.filter, { limit, offset });
        });
      },
    }),
  }),
});

builder.objectType('SendFriendshipInviteResult', {
  fields: (t) => ({
    friendship: t.field({
      type: Friendship,
      nullable: false,
      resolve: (obj) => obj.friendship,
    }),
    friendships: t.field({
      type: 'Friendships',
      nullable: false,
      args: {
        input: t.arg({
          type: 'FriendshipFilterInput',
        }),
      },
      resolve: async (obj, { input }, ctx) => {
        return {
          filter: input || {},
        };
      },
    }),
  }),
});

builder.objectType('FriendshipResponseResult', {
  fields: (t) => ({
    Friendship: t.field({
      type: Friendship,
      nullable: false,
      resolve: (obj) => obj.friendship,
    }),
    friendships: t.field({
      type: 'Friendships',
      nullable: false,
      args: {
        input: t.arg({
          type: 'FriendshipFilterInput',
        }),
      },
      resolve: async (obj, { input }, ctx) => {
        return {
          filter: input || {},
        };
      },
    }),
  }),
});

// INPUT TYPES
builder.inputType('FriendshipFilterInput', {
  fields: (t) => ({
    status: t.field({
      type: FriendshipStatus,
    }),
  }),
});

builder.inputType('SendFriendshipInviteInput', {
  fields: (t) => ({
    email: t.string({
      required: true,
    }),
  }),
});

builder.inputType('FriendshipInviteResponseInput', {
  fields: (t) => ({
    friendshipId: t.prefixedId({
      required: true,
    }),
    response: t.field({
      type: FriendshipStatus,
      required: true,
    }),
  }),
});

// DATA
async function getFriendships(
  ctx: GQLContext,
  input?: { status?: 'pending' | 'accepted' | 'declined' | null } | null,
  { limit = 10, offset = 0 } = {},
) {
  if (!ctx.session) {
    return [];
  }
  const userId = ctx.session.userId;

  let friendshipsQueryBuilder = ctx.db
    .selectFrom('Friendship')
    .where((eb) =>
      eb.or([eb('userId', '=', userId), eb('friendId', '=', userId)]),
    )
    .limit(limit)
    .offset(offset)
    .selectAll();

  if (input?.status) {
    friendshipsQueryBuilder = friendshipsQueryBuilder.where(
      'status',
      '=',
      input?.status,
    );

    if (input.status === 'pending') {
      // only show pending where initiator is not user
      friendshipsQueryBuilder = friendshipsQueryBuilder.where(
        'initiatorId',
        '!=',
        userId,
      );
    }
  }

  return friendshipsQueryBuilder.execute();
}
