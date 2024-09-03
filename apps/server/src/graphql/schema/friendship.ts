import { builder } from '../builder.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import { Friendship as DBFriendship } from '@long-game/db';
import { assignTypeName } from '../relay.js';
import { z } from 'zod';
import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import { User } from './user.js';

builder.queryFields((t) => ({
  friendships: t.field({
    type: [Friendship],
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
      if (!ctx.session) {
        return [];
      }

      let friendshipsQueryBuilder = ctx.db
        .selectFrom('FriendshipView')
        .where('userId', '=', ctx.session.userId)
        .selectAll();

      if (input?.status) {
        friendshipsQueryBuilder = friendshipsQueryBuilder.where(
          'status',
          '=',
          input.status,
        );
      }

      const friendships = await friendshipsQueryBuilder.execute();

      return friendships.map(assignTypeName('Friendship'));
    },
  }),
}));

builder.mutationFields((t) => ({
  sendFriendshipInvite: t.field({
    type: 'Friendship',
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

      const existing = await ctx.db
        .selectFrom('FriendshipView')
        .where('userId', '=', ctx.session.userId)
        .where('friendId', '=', user.id)
        .select(['status'])
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
          userId: ctx.session.userId,
          friendId: user.id,
          status: 'pending',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return assignTypeName('Friendship')(friendship);
    },
  }),
  respondToFriendshipInvite: t.field({
    type: 'Friendship',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'FriendshipInviteResponseInput',
        required: true,
        validate: {
          schema: z.object({
            friendshipId: z.string(),
            response: z.enum(['accepted', 'declined']),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const { friendshipId: id, response } = input;

      const friendship = await ctx.db
        .selectFrom('FriendshipView')
        .where('friendId', '=', id)
        .where('userId', '=', ctx.session.userId)
        .select(['status'])
        .executeTakeFirst();

      if (!friendship) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'No friendship found with that id',
        );
      }

      if (friendship.status !== 'pending') {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Friendship invite is not pending',
        );
      }

      const result = await ctx.db
        .updateTable('FriendshipView')
        .set({
          status: response,
        })
        .where('userId', '=', id)
        .where('friendId', '=', ctx.session.userId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return assignTypeName('Friendship')(result);
    },
  }),
}));

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
    const friendIds = ids
      .map(decodeFriendshipId)
      .filter(
        (decoded) => decoded.userId === userId || decoded.friendId === userId,
      )
      .map(({ userId, friendId }) => [userId, friendId])
      .flat()
      .filter((id) => id !== userId);

    const friendships = await ctx.db
      .selectFrom('FriendshipView')
      .where('FriendshipView.friendId', 'in', friendIds)
      .where('FriendshipView.userId', '=', userId)
      .selectAll()
      .execute();

    const indexes = keyIndexes(ids);

    const results = createResults<DBFriendship & { __typename: 'Friendship' }>(
      ids,
    );

    for (const friendship of friendships) {
      results[
        indexes[encodeFriendshipId(friendship.userId, friendship.friendId)]
      ] = {
        ...friendship,
        __typename: 'Friendship',
      };
    }

    return results;
  },
  id: {
    resolve: (obj) => encodeFriendshipId(obj.userId, obj.friendId),
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
      resolve: (friendship) => friendship.friendId,
      nullable: false,
    }),
  }),
});

function encodeFriendshipId(userId: string, friendId: string) {
  return [userId, friendId].sort().join(':');
}

function decodeFriendshipId(id: string) {
  const [userId, friendId] = id.split(':');
  return { userId, friendId };
}

const FriendshipStatus = builder.enumType('FriendshipStatus', {
  values: ['pending', 'accepted', 'declined'],
});

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
    friendshipId: t.id({
      required: true,
    }),
    response: t.field({
      type: FriendshipStatus,
      required: true,
    }),
  }),
});
