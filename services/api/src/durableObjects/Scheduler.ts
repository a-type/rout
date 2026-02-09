import { genericId } from '@long-game/common';
import { addSeconds } from 'date-fns';
import {
  DummyDriver,
  Kysely,
  Selectable,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';
import { SqlWrapper } from './SqlWrapper.js';

export interface ScheduledTaskTable {
  id: string;
  createdAt: string;
  type: string;
  dataJSON: string;
  scheduledAt: string;
}
export type ScheduledTask = Selectable<ScheduledTaskTable>;

export const scheduledTaskMigration = `
      CREATE TABLE IF NOT EXISTS ScheduledTask (
        id TEXT PRIMARY KEY,
        createdAt TEXT NOT NULL,
        type TEXT NOT NULL,
        dataJSON TEXT NOT NULL,
        scheduledAt TEXT NOT NULL
      );
    `;

const db = new Kysely<{
  ScheduledTask: ScheduledTaskTable;
}>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

export class Scheduler<Tasks extends { type: string; data?: any }> {
  constructor(
    private sql: SqlWrapper,
    private storage: DurableObjectStorage,
    private onTask: (
      task: {
        id: string;
        scheduledAt: Date;
      } & Tasks,
    ) => Promise<void> | void,
    private log: (
      level: 'info' | 'debug' | 'warn' | 'error',
      ...messages: any[]
    ) => void,
  ) {
    this.storage.getAlarm().then((alarm) => {
      if (alarm) {
        if (alarm < Date.now()) {
          // we might be triggering this alarm now, on wake up. so wait
          // for a bit before setting it again
          setTimeout(async () => {
            const alarm = await this.storage.getAlarm();
            if (alarm && alarm < Date.now()) {
              // if the alarm is still in the past, reset it to now
              console.warn(
                `Scheduler alarm is set in the past (${new Date(alarm).toString()}); resetting to now.`,
              );

              this.storage.setAlarm(Date.now());
            }
          }, 5000);
        }
        console.log(
          `Scheduler startup: current alarm is set for ${new Date(alarm).toString()}`,
        );
      }
    });
  }

  scheduleTask = async (
    time: Date,
    task: Tasks,
    manualId?: string,
  ): Promise<string> => {
    if (time.getTime() < Date.now()) {
      throw new Error('Cannot schedule a task in the past');
    }
    const id = manualId ?? genericId();
    await this.sql.run(
      db
        .insertInto('ScheduledTask')
        .values({
          id,
          createdAt: new Date().toISOString(),
          type: task.type,
          dataJSON: JSON.stringify(task.data ?? null),
          scheduledAt: time.toISOString(),
        })
        .onConflict((c) =>
          c.column('id').doUpdateSet({
            createdAt: new Date().toISOString(),
            type: task.type,
            dataJSON: JSON.stringify(task.data ?? null),
            scheduledAt: time.toISOString(),
          }),
        ),
    );

    const existingAlarm = await this.storage.getAlarm();
    if (!existingAlarm || existingAlarm > time.getTime()) {
      // if no alarm is set or the new task is earlier, set the alarm
      console.log(`Setting alarm for next task at ${time.toISOString()}`);
      await this.storage.setAlarm(time);
    }

    return id;
  };

  cancelTask = async (taskId: string): Promise<void> => {
    await this.sql.run(db.deleteFrom('ScheduledTask').where('id', '=', taskId));
  };

  hasTask = async (taskId: string): Promise<boolean> => {
    const result = await this.sql.run<{ count: number }>(
      db
        .selectFrom('ScheduledTask')
        .select(db.fn.count<number>('id').as('count'))
        .where('id', '=', taskId),
    );
    return result[0]?.count > 0;
  };

  handleAlarm = async () => {
    // get all tasks that are due
    const bufferSeconds = 5;
    const now = addSeconds(new Date(), bufferSeconds);
    const tasks = await this.sql.run<ScheduledTask>(
      db
        .selectFrom('ScheduledTask')
        .selectAll()
        .where('scheduledAt', '<=', now.toISOString())
        .orderBy('scheduledAt', 'asc'),
    );

    const taskErrors: Error[] = [];
    for (const task of tasks) {
      try {
        this.log(
          'info',
          `Processing scheduled task ${task.id} of type ${task.type}`,
        );
        // process each task
        await this.onTask({
          id: task.id,
          type: task.type,
          data: JSON.parse(task.dataJSON),
          scheduledAt: new Date(task.scheduledAt),
        } as any);
        // remove the task from the database
        await this.sql.run(
          db.deleteFrom('ScheduledTask').where('id', '=', task.id),
        );
        this.log('debug', `Processed and deleted task ${task.id}`);
      } catch (error) {
        this.log('error', `Error processing task ${task.id}:`, error);
        if (error instanceof Error) {
          taskErrors.push(error);
        } else {
          taskErrors.push(
            new Error(`Unknown error processing task ${task.id}`),
          );
        }
      }
    }

    if (tasks.length === 0) {
      this.log('warn', 'Alarm handled, but no tasks were due');
    }

    if (taskErrors.length > 0) {
      // trigger alarm retry by throwing an error
      throw new Error(
        `Errors processing scheduled tasks: ${taskErrors.map((e) => e.message).join(', ')}`,
      );
    }

    const [nextTask] = await this.sql.run<ScheduledTask>(
      db
        .selectFrom('ScheduledTask')
        .select(['scheduledAt', 'id', 'type'])
        .where('scheduledAt', '>', new Date().toISOString())
        .orderBy('scheduledAt', 'asc')
        .limit(1),
    );

    if (nextTask) {
      this.log(
        'info',
        `Next scheduled task ${nextTask.id} of type ${nextTask.type} at ${nextTask.scheduledAt}`,
      );
      // set the next alarm if there are more tasks
      await this.storage.setAlarm(new Date(nextTask.scheduledAt).getTime());
    }
  };
}
