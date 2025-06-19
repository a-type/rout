import { zValidator } from '@hono/zod-validator';
import {
  ENTITLEMENT_NAMES,
  idShapes,
  isPrefixedId,
  LongGameError,
  wrapRpcData,
} from '@long-game/common';
import { Hono } from 'hono';
import { proxy } from 'hono/proxy';
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
        hasAvatar: user.hasAvatar,
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
  .put(
    '/me/avatar',
    userStoreMiddleware,
    zValidator('form', z.object({ file: z.instanceof(File) })),
    async (ctx) => {
      const file = ctx.req.valid('form').file;
      const filestream = file.stream();
      const userId = ctx.get('session').userId;
      const fileType = file.name.split('.').pop();
      const path = `/${userId}/${crypto.randomUUID()}/avatar.${fileType}`;
      // list any old avatars
      const oldAvatars = await ctx.env.AVATARS_BUCKET.list({
        prefix: `/${userId}/`,
      });
      // delete old avatars
      for (const oldFile of oldAvatars.objects) {
        await ctx.env.AVATARS_BUCKET.delete(oldFile.key);
      }
      await ctx.env.AVATARS_BUCKET.put(path, filestream);
      const userStore = ctx.get('userStore');
      const updated = await userStore.updateMe({
        // using a special URL protocol to indicate it's in our bucket
        imageUrl: `bucket://${path}`,
      });
      return ctx.json({ ok: true });
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
      // remove imageUrl, it's not helpful to the client - they should use the /users/:id/avatar API
      const { imageUrl, ...rest } = wrapRpcData(user);
      return ctx.json(rest);
    },
  )
  .get(
    '/:id/avatar',
    userStoreMiddleware,
    zValidator(
      'param',
      z.object({
        id: idShapes.User,
      }),
    ),
    async (ctx) => {
      const user = await ctx
        .get('userStore')
        .getUser(ctx.req.valid('param').id);
      if (!user) {
        throw new LongGameError(LongGameError.Code.NotFound, 'User not found');
      }
      if (!user.imageUrl) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'User does not have an avatar',
        );
      }
      // if the imageUrl is a bucket URL, we need to fetch it from the bucket
      if (user.imageUrl.startsWith('bucket://')) {
        const path = user.imageUrl.replace('bucket://', '');
        const avatar = await ctx.env.AVATARS_BUCKET.get(path);
        if (!avatar) {
          throw new LongGameError(
            LongGameError.Code.NotFound,
            'Avatar not found in bucket',
          );
        }
        return ctx.body(avatar.body, 200, {
          'Content-Type': avatar.httpMetadata?.contentType ?? 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: avatar.httpEtag,
          Date: avatar.uploaded.toUTCString(),
        });
      }
      // otherwise, it's a regular URL, so we can just proxy to it
      return proxy(user.imageUrl);
    },
  );
