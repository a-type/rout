import { assert } from '@a-type/utils';
import { Database } from './tables.js'; // this is the Database interface we defined earlier
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite';
export * from './utils.js';
export { sql } from 'kysely';

import migrations from './migrations/index.js';

import { SerializePlugin } from 'kysely-plugin-serialize';
import {
  TimestampsPlugin,
  migrateToLatest as migrateInternal,
} from '@a-type/kysely';

export function createDb() {
  const DATABASE_FILE = process.env.DATABASE_FILE;
  assert(DATABASE_FILE, 'DATABASE_FILE environment variable must be set');
  const dialect = new SqliteDialect({
    database: new SQLite(DATABASE_FILE),
  });

  // Database interface is passed to Kysely's constructor, and from now on, Kysely
  // knows your database structure.
  // Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
  // to communicate with your database.
  return new Kysely<Database>({
    dialect,
    plugins: [new TimestampsPlugin<Database>(), new SerializePlugin()],
  });
}

export const db = createDb();

export type DB = typeof db;

export type * from './tables.js';

export function migrateToLatest() {
  return migrateInternal(db, migrations);
}
export {
  id,
  hashPassword,
  comparePassword,
  dateTime,
  compareDates,
} from '@a-type/kysely';
