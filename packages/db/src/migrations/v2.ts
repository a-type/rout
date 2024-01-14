import { Kysely } from 'kysely';

export async function up(db: Kysely<any>) {
  // replacing "GameMove" to "GameTurn" which has a different primary key
  // add a constraint on GameTurn that userId + roundIndex must be unique -
  // only one turn per user per round

  // because existing moves would have to be grouped into turns using
  // logic that's not really easily available here, and because the app
  // isn't live yet, we're just going to drop the table and start over.
  await db.schema
    .createTable('GameTurn')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('gameSessionId', 'text', (col) =>
      col.notNull().references('GameSession.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) =>
      col.references('User.id').onDelete('set null'),
    )
    .addColumn('data', 'text', (col) => col.notNull())
    .addColumn('roundIndex', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('GameTurn_pk', [
      'gameSessionId',
      'userId',
      'roundIndex',
    ])
    .execute();

  await db.schema
    .createIndex('GameTurn_gameSessionId_index')
    .on('GameTurn')
    .column('gameSessionId')
    .execute();

  await db.schema
    .createIndex('GameTurn_userId_index')
    .on('GameTurn')
    .column('userId')
    .execute();
}

export async function down(db: Kysely<any>) {
  // copied from v1
  await db.schema
    .createTable('GameMove')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('gameSessionId', 'text', (col) =>
      col.notNull().references('GameSession.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) =>
      col.references('User.id').onDelete('set null'),
    )
    .addColumn('data', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('GameMove_gameSessionId_index')
    .on('GameMove')
    .column('gameSessionId')
    .execute();
  await db.schema
    .createIndex('GameMove_userId_index')
    .on('GameMove')
    .column('userId')
    .execute();

  await db.schema.dropTable('GameTurn').execute();
}
