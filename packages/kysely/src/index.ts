import { Kysely } from 'kysely';
import { Database } from './tables.js';
export { sql } from 'kysely';
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite';

import { TimestampsPlugin } from '@a-type/kysely';
import { D1Dialect } from 'kysely-d1';
import { defaultDeserializer, SerializePlugin } from 'kysely-plugin-serialize';

export function createDb(bindings: { DB: any }) {
  return new Kysely<Database>({
    dialect: new D1Dialect({
      database: bindings.DB,
    }) as any,
    plugins: [
      new TimestampsPlugin({
        ignoredTables: ['<d1_migrations>'],
      }),
      new SerializePlugin({
        deserializer: (value) => {
          const deserialized = defaultDeserializer(value);
          if (deserialized instanceof Date) {
            // do not deserialize dates.
            return deserialized.toUTCString();
          }
          return deserialized;
        },
      }),
    ],
  });
}

export type DB = Kysely<Database>;

export {
  compareDates,
  comparePassword,
  dateTime,
  hashPassword,
  sqliteNow,
} from '@a-type/kysely';
export type * from './tables.js';
