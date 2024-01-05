import { db, sql } from '@long-game/db';
import { router, userProcedure } from './util.js';
import { TRPCError } from '@trpc/server';
import * as zod from 'zod';
import { assert } from '@a-type/utils';

export const friendshipsRouter = router({
  createFriendshipInvite: userProcedure
    .input(
      zod.object({
        email: zod.string(),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const user = await db
        .selectFrom('User')
        .where('email', '=', opts.input.email)
        .select(['id'])
        .executeTakeFirst();

      if (!user) {
        throw new TRPCError({
          message: 'No user found with that email',
          code: 'NOT_FOUND',
        });
      }

      const friendship = await db
        .selectFrom('FriendshipView')
        .where('userId', '=', session.userId)
        .where('friendId', '=', user.id)
        .select(['status'])
        .executeTakeFirst();

      if (friendship) {
        throw new TRPCError({
          message: 'Friendship already exists',
          code: 'BAD_REQUEST',
        });
      }

      await db
        .insertInto('Friendship')
        .values({
          userId: session.userId,
          friendId: user.id,
          status: 'pending',
        })
        .execute();

      return true;
    }),

  respondToInvite: userProcedure
    .input(
      zod.object({
        id: zod.string(),
        response: zod.union([zod.literal('accepted'), zod.literal('declined')]),
      }),
    )
    .mutation(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      const friendship = await db
        .selectFrom('FriendshipView')
        .where('friendId', '=', opts.input.id)
        .where('userId', '=', session.userId)
        .select(['status'])
        .executeTakeFirst();

      if (!friendship) {
        throw new TRPCError({
          message: 'No friendship invite found',
          code: 'NOT_FOUND',
        });
      }

      if (friendship.status !== 'pending') {
        throw new TRPCError({
          message: 'Friendship invite is not pending',
          code: 'BAD_REQUEST',
        });
      }

      await db
        .updateTable('Friendship')
        .set({
          status: opts.input.response,
        })
        .where('userId', '=', opts.input.id)
        .where('friendId', '=', session.userId)
        .execute();

      return true;
    }),

  list: userProcedure
    .input(
      zod.object({
        statusFilter: zod.union([
          zod.literal('pending'),
          zod.literal('accepted'),
          zod.literal('declined'),
          zod.literal('all'),
        ]),
      }),
    )
    .query(async (opts) => {
      const session = opts.ctx.session;
      assert(!!session);

      let friendshipsQuery = db
        .selectFrom('FriendshipView')
        .where('userId', '=', session.userId)
        .innerJoin('User', 'User.id', 'FriendshipView.friendId')
        .select([
          'friendId as id',
          'status',
          'User.imageUrl as imageUrl',
          'User.email as email',
        ])
        .select(
          sql<string>`COALESCE(User.friendlyName, User.fullName)`.as('name'),
        );

      if (opts.input.statusFilter !== 'all') {
        friendshipsQuery = friendshipsQuery.where(
          'status',
          '=',
          opts.input.statusFilter,
        );
      }

      const friendships = await friendshipsQuery.orderBy('name asc').execute();

      return friendships;
    }),
});
