import { zValidator } from '@hono/zod-validator';
import {
  ENTITLEMENT_NAMES,
  isPrefixedId,
  LongGameError,
  wrapRpcData,
} from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { sessions } from '../auth/session';
import { Env } from '../config/ctx';
import { sessionMiddleware, userStoreMiddleware } from '../middleware';

export const usersRouter = new Hono<Env>()
  .get('/me', sessionMiddleware, async (ctx) => {
    const session = ctx.get('session');
    if (!session) {
      return ctx.json(null);
    }

    const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(
      session.userId,
    );
    try {
      const user = await userStore.getMe();
      return ctx.json({
        id: user.id,
        displayName: user.displayName,
        color: user.color,
        imageUrl: user.imageUrl,
        email: user.email,
        isGoldMember:
          !!user.subscriptionEntitlements?.[
            ENTITLEMENT_NAMES.EXTRA_GAME_SESSIONS
          ],
        isCustomer: !!user.stripeCustomerId,
        isProductAdmin: !!user.isProductAdmin,
      });
    } catch (e) {
      const err = LongGameError.fromInstanceOrRpc(e);
      if (err.code === LongGameError.Code.NotFound) {
        // user doesn't exist... this happens sometimes in dev mode. could also
        // happen if a user was deleted.
        const removeSession = sessions.clearSession(ctx);
        for (const [key, value] of removeSession.headers.entries()) {
          ctx.header(key, value, { append: true });
        }
        return ctx.json(null, 401);
      } else {
        throw err;
      }
    }
  })
  .put(
    '/me',
    userStoreMiddleware,
    zValidator(
      'json',
      z.object({
        displayName: z.string().optional(),
        color: z.string().optional(),
        imageUrl: z.string().optional(),
        sendEmailUpdates: z.boolean().optional(),
      }),
    ),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const updated = await ctx.get('userStore').updateMe(body);
      return ctx.json(wrapRpcData(updated));
    },
  )
  .get('/me/notificationSettings', userStoreMiddleware, async (ctx) => {
    const userStore = ctx.get('userStore');
    const settings = await userStore.getNotificationSettings();
    return ctx.json(wrapRpcData(settings));
  })
  .put(
    '/me/notificationSettings',
    userStoreMiddleware,
    zValidator(
      'json',
      z.object({
        'turn-ready': z
          .object({
            email: z.boolean(),
            push: z.boolean(),
          })
          .optional(),
        'game-invite': z
          .object({
            email: z.boolean(),
            push: z.boolean(),
          })
          .optional(),
        'friend-invite': z
          .object({
            email: z.boolean(),
            push: z.boolean(),
          })
          .optional(),
        'new-game': z
          .object({
            email: z.boolean(),
            push: z.boolean(),
          })
          .optional(),
      }),
    ),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const userStore = ctx.get('userStore');
      const updated = await userStore.updateNotificationSettings(body);
      return ctx.json(wrapRpcData(updated));
    },
  )
  .get(
    '/:id',
    userStoreMiddleware,
    zValidator(
      'param',
      z.object({
        id: z.custom((v) => isPrefixedId(v, 'u')),
      }),
    ),
    async (ctx) => {
      const id = ctx.req.valid('param').id;
      const userStore = ctx.get('userStore');
      const user = await userStore.getUser(id);
      if (!user) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'User not found',
        );
      }
      return ctx.json(user);
    },
  );
