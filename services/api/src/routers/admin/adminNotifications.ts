import { zValidator } from '@hono/zod-validator';
import { id, idShapes } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../config/ctx.js';
import { getNotificationScheduler } from '../../durableObjects/notificationScheduler/NotificationScheduler.js';

export const adminNotificationsRouter = new Hono<Env>().post(
  '/send-test/:userId',
  zValidator(
    'param',
    z.object({
      userId: idShapes.User,
    }),
  ),
  async (ctx) => {
    const { userId } = ctx.req.valid('param');
    const scheduler = await getNotificationScheduler(userId, ctx.env);
    await scheduler.add(userId, {
      type: 'test',
      id: id('no'),
    });
    return ctx.json({ success: true });
  },
);
