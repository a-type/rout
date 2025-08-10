import { PrefixedId } from '@long-game/common';
import { AnyNotification } from '@long-game/notifications';
import { DurableObject } from 'cloudflare:workers';
import { notifyUser } from '../../services/notification.js';
import { Scheduler } from '../Scheduler.js';
import { SqlWrapper } from '../SqlWrapper.js';
import { db, migrations } from './sql.js';

type ScheduledTasks = {
  type: 'flush';
};

export class NotificationScheduler extends DurableObject<ApiBindings> {
  #sql: SqlWrapper;
  #scheduler: Scheduler<ScheduledTasks>;

  constructor(ctx: DurableObjectState, env: ApiBindings) {
    super(ctx, env);
    this.#sql = new SqlWrapper(ctx.storage, migrations);
    this.#scheduler = new Scheduler<ScheduledTasks>(
      this.#sql,
      ctx.storage,
      this.#handleScheduledTask,
    );
  }

  #handleScheduledTask = (task: ScheduledTasks) => {
    if (task.type === 'flush') {
      return this.#sendNotifications();
    }
  };

  #sendNotifications = async () => {
    const pendingRaw = await this.#sql.run(
      db.selectFrom('Notification').selectAll().where('sentAt', 'is', null),
    );
    const pending = pendingRaw.map((n) => ({
      ...n,
      data: JSON.parse(n.dataJSON) as AnyNotification,
    }));
    // segment by type
    const byType: {
      [type in AnyNotification['type']]?: {
        notification: Extract<AnyNotification, { type: type }>;
        id: PrefixedId<'no'>;
        userId: PrefixedId<'u'>;
      }[];
    } = {};
    for (const notification of pending) {
      (byType[notification.data.type] ??= []).push({
        notification: notification.data as any,
        id: notification.id,
        userId: notification.userId,
      });
    }
    // send by type, combining where possible
    const markSent = new Set<PrefixedId<'no'>>();
    for (const _type of Object.keys(byType)) {
      const type = _type as AnyNotification['type'];
      if (!byType[type]) continue;
      switch (type) {
        case 'turn-ready': {
          // collapse into one
          const turns = byType[type].flatMap((n) => n.notification.turns);
          const userId = byType[type][0].userId as PrefixedId<'u'>;
          await notifyUser(
            userId,
            {
              type: 'turn-ready',
              id: byType[type][0].id,
              turns,
            },
            this.env,
          );
          break;
        }
        default: {
          // can't group, just send them all
          await Promise.all(
            byType[type].map(async (n) => {
              await notifyUser(
                n.userId as PrefixedId<'u'>,
                n.notification,
                this.env,
              ),
                markSent.add(n.id);
            }),
          );
          break;
        }
      }
      byType[type].map((n) => n.id).forEach((id) => markSent.add(id));
    }

    // mark all sent
    if (markSent.size > 0) {
      await this.#sql.run(
        db
          .updateTable('Notification')
          .set({ sentAt: new Date().toISOString() })
          .where('id', 'in', Array.from(markSent)),
      );
    }
  };

  add = async (userId: PrefixedId<'u'>, noti: AnyNotification) => {
    await this.#sql.run(
      db
        .insertInto('Notification')
        .values({
          id: noti.id,
          userId,
          createdAt: new Date().toISOString(),
          sentAt: null,
          dataJSON: JSON.stringify(noti),
        })
        .onConflict((c) => c.column('id').doNothing()),
    );
    // buffer 5 minutes
    await this.#scheduler.scheduleTask(
      new Date(Date.now() + 1000 * 60 * 5),
      { type: 'flush' },
      'flush-notifications',
    );
  };

  alarm(): void | Promise<void> {
    return this.#scheduler.handleAlarm();
  }
}

export async function getNotificationScheduler(
  userId: PrefixedId<'u'>,
  env: ApiBindings,
) {
  const id = env.NOTIFICATION_SCHEDULER.idFromName(userId);
  return env.NOTIFICATION_SCHEDULER.get(id);
}
