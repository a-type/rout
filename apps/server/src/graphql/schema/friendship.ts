import { builder } from '../builder.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import { Friendship as DBFriendship, id } from '@long-game/db';
import { assignTypeName } from '../relay.js';
import { z } from 'zod';
import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import { User } from './user.js';
import { decodeGlobalID } from '@pothos/plugin-relay';

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
      const userId = ctx.session.userId;

      let friendshipsQueryBuilder = ctx.db
        .selectFrom('Friendship')
        .where((eb) =>
          eb.or([eb('userId', '=', userId), eb('friendId', '=', userId)]),
        )
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
          id: id(),
          userId,
          friendId,
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
      const { friendshipId, response } = input;
      const id = decodeGlobalID(friendshipId).id;

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

    const friendships = await ctx.db
      .selectFrom('Friendship')
      .where('Friendship.id', 'in', ids)
      .where((eb) =>
        eb.or([
          eb('Friendship.userId', '=', userId),
          eb('Friendship.friendId', '=', userId),
        ]),
      )
      .selectAll()
      .execute();

    const indexes = keyIndexes(ids);

    const results = createResults<DBFriendship & { __typename: 'Friendship' }>(
      ids,
    );

    for (const friendship of friendships) {
      results[indexes[friendship.id]] = {
        ...friendship,
        __typename: 'Friendship',
      };
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
