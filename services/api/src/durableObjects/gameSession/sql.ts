import { PrefixedId, SystemChatAuthorId } from '@long-game/common';
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
  Turn: TurnTable;
  ChatMessage: ChatMessageTable;
  GameVote: GameVoteTable;
  ReadyUp: ReadyUpTable;
  ScheduledTask: ScheduledTaskTable;
}

interface TurnTable {
  id: PrefixedId<'t'>;
  createdAt: string;
  data: string;
  roundIndex: number;
  playerId: PrefixedId<'u'>;
}
export type Turn = Selectable<TurnTable>;

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
  reactionsJSON: string;
}
export type ChatMessage = Selectable<ChatMessageTable>;

interface GameVoteTable {
  userId: PrefixedId<'u'>;
  gameId: string;
  createdAt: string;
}
export type GameVote = Selectable<GameVoteTable>;

interface ReadyUpTable {
  userId: PrefixedId<'u'>;
  createdAt: string;
}
export type ReadyUp = Selectable<ReadyUpTable>;

export const migrations: SQLMigrations.SQLSchemaMigration[] = [
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
  {
    idMonotonicInc: 2,
    description: 'Add chat reactions',
    sql: `
      ALTER TABLE ChatMessage ADD COLUMN reactionsJSON TEXT NOT NULL DEFAULT '{}';
    `,
  },
  {
    idMonotonicInc: 3,
    description: 'Add indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_turn_playerId ON Turn (playerId);
      CREATE INDEX IF NOT EXISTS idx_turn_roundIndex ON Turn (roundIndex);
      CREATE INDEX IF NOT EXISTS idx_chatMessage_createdAt ON ChatMessage (createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_chatMessage_recipientIdsList ON ChatMessage (recipientIdsList);
    `,
  },
  {
    idMonotonicInc: 4,
    description: 'Add GameVote and ReadyUp tables',
    sql: `
      CREATE TABLE IF NOT EXISTS GameVote (
        userId TEXT NOT NULL,
        gameId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (userId, gameId)
      );
      CREATE TABLE IF NOT EXISTS ReadyUp (
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (userId)
      );
    `,
  },
  {
    idMonotonicInc: 5,
    description: 'Add ScheduledTask table',
    sql: scheduledTaskMigration,
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
