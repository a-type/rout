import { Kysely } from 'kysely';
export { sql } from 'kysely';
export { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/sqlite';
import { TimestampsPlugin } from '@a-type/kysely';
import { D1Dialect } from 'kysely-d1';
import { defaultDeserializer, SerializePlugin } from 'kysely-plugin-serialize';
export function createDb(bindings) {
    return new Kysely({
        dialect: new D1Dialect({
            database: bindings.DB,
        }),
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
export { compareDates, comparePassword, dateTime, hashPassword, } from '@a-type/kysely';
//# sourceMappingURL=index.js.map