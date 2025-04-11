import { Kysely } from 'kysely';
import { Database } from './tables.js';
export { sql } from 'kysely';
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite';
export declare function createDb(bindings: {
    DB: any;
}): Kysely<Database>;
export type DB = Kysely<Database>;
export { compareDates, comparePassword, dateTime, hashPassword, } from '@a-type/kysely';
export type * from './tables.js';
//# sourceMappingURL=index.d.ts.map