import { SQLMigrations } from 'durable-utils';
import { Compilable, CompiledQuery } from 'kysely';

export type QueryRow<T extends CompiledQuery<unknown>> =
  T extends CompiledQuery<infer R> ? R : never;

export class SqlWrapper {
  #sql;
  #migrations;
  constructor(
    storage: DurableObjectStorage,
    migrations: SQLMigrations.SQLSchemaMigration[],
  ) {
    this.#sql = storage.sql;
    this.#migrations = new SQLMigrations.SQLSchemaMigrations({
      doStorage: storage,
      migrations,
    });
  }

  run = async <O extends Record<string, SqlStorageValue>>(
    query: Compilable<O>,
    {
      debug,
    }: {
      debug?: boolean;
    } = {},
  ): Promise<O[]> => {
    await this.#migrations.runAll();
    const compiled = query.compile();
    if (debug) {
      console.log('SQL:', compiled.sql);
      console.log(
        'Parameters:',
        `(${compiled.parameters.length})`,
        compiled.parameters,
      );
    }
    return this.#sql.exec<O>(compiled.sql, ...compiled.parameters).toArray();
  };
}
