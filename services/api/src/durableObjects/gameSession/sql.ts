import { PrefixedId, SystemChatAuthorId } from '@long-game/common';
import { SQLMigrations } from 'durable-utils';
import {
  Compilable,
  CompiledQuery,
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';

interface Tables {
  Turn: TurnTable;
  ChatMessage: ChatMessageTable;
}

interface TurnTable {
  id: PrefixedId<'t'>;
  createdAt: string;
  data: string;
  roundIndex: number;
  playerId: PrefixedId<'u'>;
}

interface ChatMessageTable {
  id: PrefixedId<'cm'>;
  createdAt: string;
  authorId: PrefixedId<'u'> | SystemChatAuthorId;
  content: string;
  positionJSON: string | null;
  sceneId: string | null;
  recipientIdsList: string | null;
  roundIndex: number;
  metadataJSON: string | null;
}

const migrations: SQLMigrations.SQLSchemaMigration[] = [
  {
    idMonotonicInc: 1,
    description: 'Add initial tables',
    sql: `
      CREATE TABLE IF NOT EXISTS Turn (
        id TEXT PRIMARY KEY,
        createdAt TEXT NOT NULL,
        data TEXT NOT NULL,
        roundIndex INTEGER NOT NULL,
        playerId TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ChatMessage (
        id TEXT PRIMARY KEY,
        createdAt TEXT NOT NULL,
        authorId TEXT NOT NULL,
        content TEXT NOT NULL,
        positionJSON TEXT,
        sceneId TEXT,
        recipientIdsList TEXT,
        roundIndex INTEGER NOT NULL,
        metadataJSON TEXT
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

export type QueryRow<T extends CompiledQuery<unknown>> =
  T extends CompiledQuery<infer R> ? R : never;

export class SqlWrapper {
  #sql;
  #migrations;
  constructor(storage: DurableObjectStorage) {
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
      console.log('Parameters:', compiled.parameters);
    }
    return this.#sql.exec<O>(compiled.sql, ...compiled.parameters).toArray();
  };
}
