import { PrefixedId } from '@long-game/common';
import { SQLMigrations } from 'durable-utils';
import {
  DummyDriver,
  Kysely,
  Selectable,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';
import { scheduledTaskMigration, ScheduledTaskTable } from '../Scheduler.js';

export interface Tables {
  ScheduledTask: ScheduledTaskTable;
  Notification: NotificationTable;
}

interface NotificationTable {
  id: PrefixedId<'no'>;
  userId: PrefixedId<'u'>;
  createdAt: string;
  sentAt: string | null;
  dataJSON: string;
}
export type Notification = Selectable<NotificationTable>;

export const migrations: SQLMigrations.SQLSchemaMigration[] = [
  {
    idMonotonicInc: 1,
    description: 'Add ScheduledTask table',
    sql: scheduledTaskMigration,
  },
  {
    idMonotonicInc: 2,
    description: 'Add Notification table',
    sql: `
			CREATE TABLE IF NOT EXISTS Notification (
				id TEXT PRIMARY KEY,
				userId TEXT NOT NULL,
				createdAt TEXT NOT NULL,
				sentAt TEXT,
				dataJSON TEXT NOT NULL
			);
		`,
  },
];

export const db = new Kysely<Tables>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});
