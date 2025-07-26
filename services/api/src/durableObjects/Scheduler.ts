import { genericId } from '@long-game/common';
import { db, ScheduledTask, SqlWrapper } from './gameSession/sql.js';

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
  ) {}

  scheduleTask = async (
    time: Date,
    task: Tasks,
    manualId?: string,
  ): Promise<string> => {
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
      await this.storage.setAlarm(time);
    }

    return id;
  };

  cancelTask = async (taskId: string): Promise<void> => {
    await this.sql.run(db.deleteFrom('ScheduledTask').where('id', '=', taskId));
  };

  handleAlarm = async () => {
    // get all tasks that are due
    const now = Date.now();
    const tasks = await this.sql.run<ScheduledTask>(
      db
        .selectFrom('ScheduledTask')
        .selectAll()
        .where('scheduledAt', '<=', new Date(now).toISOString())
        .orderBy('scheduledAt', 'asc'),
    );

    const taskErrors: Error[] = [];
    for (const task of tasks) {
      try {
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
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        if (error instanceof Error) {
          taskErrors.push(error);
        } else {
          taskErrors.push(
            new Error(`Unknown error processing task ${task.id}`),
          );
        }
      }
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
        .select('scheduledAt')
        .where('scheduledAt', '>', new Date().toISOString())
        .orderBy('scheduledAt', 'asc')
        .limit(1),
    );

    if (nextTask) {
      // set the next alarm if there are more tasks
      await this.storage.setAlarm(new Date(nextTask.scheduledAt).getTime());
    }
  };
}
