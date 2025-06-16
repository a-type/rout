import { zValidator } from '@hono/zod-validator';
import { idShapes, PrefixedId, wrapRpcData } from '@long-game/common';
import { AnyNotification } from '@long-game/notifications';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';

export const notificationsRouter = new Hono<Env>()
  .get(
    '/',
    userStoreMiddleware,
    zValidator(
      'query',
      z.object({
        first: z.coerce.number().int().positive().optional(),
        after: z.string().optional(),
        status: z.enum(['unread', 'read']).optional(),
      }),
    ),
    async (ctx) => {
      const userStore = ctx.get('userStore');
      const query = ctx.req.valid('query');
      const notifications = await userStore.getNotifications({
        first: query.first,
        after: query.after,
        status: query.status,
      });
      return ctx.json<{
        results: {
          id: PrefixedId<'no'>;
          createdAt: string;
          updatedAt: string;
          readAt: string | null;
          data: AnyNotification;
          userId: PrefixedId<'u'>;
        }[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      }>(notifications);
    },
  )
  .put(
    '/:id',
    userStoreMiddleware,
    zValidator('param', z.object({ id: idShapes.Notification })),
    zValidator('json', z.object({ read: z.boolean() })),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const userStore = ctx.get('userStore');
      const updated = await userStore.markNotificationAsRead(
        ctx.req.valid('param').id,
        body.read,
      );
      return ctx.json(wrapRpcData(updated));
    },
  )
  .delete(
    '/:id',
    userStoreMiddleware,
    zValidator('param', z.object({ id: idShapes.Notification })),
    async (ctx) => {
      const userStore = ctx.get('userStore');
      await userStore.deleteNotification(ctx.req.valid('param').id);
      return ctx.json({ deleted: true });
    },
  )
  .post('/markAllRead', userStoreMiddleware, async (ctx) => {
    const userStore = ctx.get('userStore');
    await userStore.markAllNotificationsAsRead();
    return ctx.json({ ok: true });
  });
