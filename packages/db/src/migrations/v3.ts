import { Kysely } from 'kysely';

export async function up(db: Kysely<any>) {
  // adds chat messages
  await db.schema
    .createTable('ChatMessage')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('gameSessionId', 'text', (col) =>
      col.notNull().references('GameSession.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) =>
      col.references('User.id').onDelete('set null'),
    )
    .addColumn('message', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('ChatMessage_gameSessionId_index')
    .on('ChatMessage')
    .column('gameSessionId')
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('ChatMessage').execute();
}
