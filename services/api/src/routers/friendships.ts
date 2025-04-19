import { zValidator } from '@hono/zod-validator';
import {
  assertPrefixedId,
  isPrefixedId,
  LongGameError,
  PrefixedId,
  wrapRpcData,
} from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';
import { sendFriendshipInviteEmail } from '../services/email';

export const friendshipsRouter = new Hono<Env>()
  .get(
    '/',
    userStoreMiddleware,
    zValidator(
      'query',
      z.object({
        status: z.enum(['pending', 'accepted', 'declined']).optional(),
      }),
    ),
    async (ctx) => {
      const friendships = await ctx.get('userStore').getFriendships();
      return ctx.json(wrapRpcData(friendships));
    },
  )
  .get(
    '/invites',
    zValidator(
      'query',
      z.object({
        direction: z.enum(['incoming', 'outgoing']),
      }),
    ),
    userStoreMiddleware,
    async (ctx) => {
      const friendships = await ctx.get('userStore').getFriendshipInvites({
        direction: ctx.req.valid('query').direction,
      });
      return ctx.json(wrapRpcData(friendships));
    },
  )
  .post(
    '/invites',
    userStoreMiddleware,
    zValidator(
      'json',
      z.object({
        email: z.string().optional(),
        userId: z
          .custom<PrefixedId<'u'>>((v) => isPrefixedId(v, 'u'))
          .optional(),
        landOnGameSessionId: z
          .custom<PrefixedId<'gs'>>((v) => isPrefixedId(v, 'gs'))
          .optional(),
      }),
    ),
    async (ctx) => {
      const {
        email: emailAddress,
        userId,
        landOnGameSessionId,
      } = ctx.req.valid('json');
      const userStore = ctx.get('userStore');
      const { invite, created } = await userStore.insertFriendshipInvite({
        email: emailAddress,
        userId,
      });

      if (created) {
        const user = await userStore.getMe();
        const inviteLink = new URL(`/invite/${invite.id}`, ctx.env.UI_ORIGIN);
        if (landOnGameSessionId) {
          inviteLink.searchParams.set(
            'landOnGameSessionId',
            landOnGameSessionId,
          );
        }
        try {
          await sendFriendshipInviteEmail(ctx, {
            to: invite.email,
            inviterName: user.displayName,
            inviteLink: inviteLink.toString(),
          });
        } catch (err) {
          console.error('Failed to send email', err);
          // continue anyway, invite will still be in their UI
        }
      }
      return ctx.json({ success: true });
    },
  )
  .post(
    '/invites/:id',
    userStoreMiddleware,
    zValidator(
      'json',
      z.object({ response: z.enum(['accepted', 'declined', 'retracted']) }),
    ),
    async (ctx) => {
      const { response } = ctx.req.valid('json');
      const id = ctx.req.param('id');
      assertPrefixedId<'fi'>(id, 'fi');
      await ctx.get('userStore').respondToFriendshipInvite(id, response);
      return ctx.json({ success: true });
    },
  )
  .get('/invites/:id', async (ctx) => {
    // public route for fetching basic details of invite
    const id = ctx.req.param('id');
    assertPrefixedId<'fi'>(id, 'fi');
    const data = await ctx.env.PUBLIC_STORE.getPublicFriendInvite(id);
    if (!data) {
      throw new LongGameError(
        LongGameError.Code.NotFound,
        'Friendship invite not found',
      );
    }
    return ctx.json(wrapRpcData(data));
  });
