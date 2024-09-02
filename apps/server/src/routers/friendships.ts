import { Hono } from 'hono';
import { Env } from '../config/ctx.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { loggedInMiddleware } from '../middleware/session.js';
import { LongGameError } from '@long-game/common';
import { db, sql } from '@long-game/db';

export const friendshipsRouter = new Hono<Env>()
  .post(
    '/',
    loggedInMiddleware,
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const { email } = ctx.req.valid('json');

      const user = await db
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

      const friendship = await db
        .selectFrom('FriendshipView')
        .where('userId', '=', session.userId)
        .where('friendId', '=', user.id)
        .select(['status'])
        .executeTakeFirst();

      if (friendship) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Friendship already exists',
        );
      }

      await db
        .insertInto('Friendship')
        .values({
          userId: session.userId,
          friendId: user.id,
          status: 'pending',
        })
        .execute();

      return ctx.json({ success: true });
    },
  )
  .post(
    '/:id/respond',
    loggedInMiddleware,
    zValidator(
      'json',
      z.object({
        response: z.enum(['accepted', 'declined']),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const id = ctx.req.param('id');

      const { response } = ctx.req.valid('json');

      const friendship = await db
        .selectFrom('FriendshipView')
        .where('friendId', '=', id)
        .where('userId', '=', session.userId)
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

      await db
        .updateTable('FriendshipView')
        .set({
          status: response,
        })
        .where('userId', '=', id)
        .where('friendId', '=', session.userId)
        .execute();

      return ctx.json({ success: true });
    },
  )
  .get(
    '/',
    loggedInMiddleware,
    zValidator(
      'query',
      z.object({
        statusFilter: z
          .enum(['pending', 'accepted', 'declined', 'all'])
          .optional(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const { statusFilter = 'all' } = ctx.req.valid('query');

      let friendshipsQueryBuilder = db
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

      if (statusFilter !== 'all') {
        friendshipsQueryBuilder = friendshipsQueryBuilder.where(
          'status',
          '=',
          statusFilter,
        );
      }

      const friendships = await friendshipsQueryBuilder
        .orderBy('name asc')
        .execute();

      return ctx.json(friendships);
    },
  );
