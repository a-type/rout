import { Kysely } from 'kysely';
import { Database } from './tables.js'; // this is the Database interface we defined earlier
export { sql } from 'kysely';
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite';

import { TimestampsPlugin } from '@a-type/kysely';
import { D1Dialect } from 'kysely-d1';
import { SerializePlugin } from 'kysely-plugin-serialize';

export function createDb(bindings: { DB: any }) {
  return new Kysely<Database>({
    dialect: new D1Dialect({
      database: bindings.DB,
    }) as any,
    plugins: [
      new TimestampsPlugin({
        ignoredTables: ['<d1_migrations>'],
      }),
      new SerializePlugin(),
    ],
  });
}

export type DB = Kysely<Database>;

export {
  compareDates,
  comparePassword,
  dateTime,
  hashPassword,
} from '@a-type/kysely';
export type * from './tables.js';
