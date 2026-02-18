import { PrefixedId } from '@long-game/common';
import {
  AnyNotification,
  TurnReadyNotification,
} from '@long-game/notifications';
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
  #log = (level: 'info' | 'debug' | 'warn' | 'error', ...messages: any[]) => {
    console[level](
      `[NotificationScheduler ${this.ctx.id.toString()}]`,
      ...messages,
    );
  };

  constructor(ctx: DurableObjectState, env: ApiBindings) {
    super(ctx, env);
    this.#sql = new SqlWrapper(ctx.storage, migrations);
    this.#scheduler = new Scheduler<ScheduledTasks>(
      this.#sql,
      ctx.storage,
      this.#handleScheduledTask,
      this.#log,
    );
  }

  #handleScheduledTask = (task: ScheduledTasks) => {
    console.log(`Handling scheduled task: ${JSON.stringify(task)}`);
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
          // just in case
          if (turns.length === 0) continue;
          // deduplicate game sessions
          const byGameSession = turns.reduce(
            (acc, turn) => {
              acc[turn.gameSessionId] = turn;
              return acc;
            },
            {} as Record<
              PrefixedId<'gs'>,
              TurnReadyNotification['turns'][number]
            >,
          );
          const userId = byType[type][0].userId as PrefixedId<'u'>;
          await notifyUser(
            userId,
            {
              type: 'turn-ready',
              id: byType[type][0].id,
              turns: Object.values(byGameSession),
            },
            this.env,
          );
          console.log(`Notified user ${userId} of ${turns.length} turns ready`);
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
              );
              markSent.add(n.id);
              console.log(
                `Notified user ${n.userId} of notification ${n.id} (${type})`,
              );
            }),
          );
          break;
        }
      }
      byType[type].map((n) => n.id).forEach((id) => markSent.add(id));
    }

    // mark all sent... in batches, I guess.
    if (markSent.size > 0) {
      const toMark = Array.from(markSent);
      console.log(`Marking ${toMark.length} notifications as sent`);
      const batchSize = 100;
      for (let i = 0; i < toMark.length; i += batchSize) {
        const batch = toMark.slice(i, i + batchSize);
        console.log(`Marking batch of ${batch.length} notifications as sent`);
        await this.#sql.run(
          db
            .updateTable('Notification')
            .set({ sentAt: new Date().toISOString() })
            .where('id', 'in', batch),
          {
            debug: true,
          },
        );
      }
    }
  };

  async add(userId: PrefixedId<'u'>, noti: AnyNotification) {
    console.log(`Buffering notification for user ${userId}:`, noti);
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
  }

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
