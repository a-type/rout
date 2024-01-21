import { Kysely } from 'kysely';

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function up(db: Kysely<any>) {
  // drop foreign key of userId on GameMove - so that the user ID
  // can stay intact if the user is deleted
  await db.schema
    .alterTable('GameMove')
    .dropConstraint('GameMove_userId_fkey')
    .execute();

  // add dummy user ID to GameMoves without one
  await db
    .updateTable('GameMove')
    .set({
      userId: DUMMY_USER_ID,
    })
    .where('userId', '=', null)
    .execute();

  await db.schema
    .alterTable('GameMove')
    .alterColumn('userId', (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<any>) {
  // add foreign key of userId on GameMove
  await db.schema
    .alterTable('GameMove')
    .addForeignKeyConstraint('GameMove_userId_fkey', ['userId'], 'User', ['id'])
    .onDelete('set null')
    .execute();

  await db.schema
    .alterTable('GameMove')
    .alterColumn('userId', (col) => col.dropNotNull())
    .execute();

  // remove dummy user ID from GameMoves
  await db
    .updateTable('GameMove')
    .set({
      userId: null,
    })
    .where('userId', '=', DUMMY_USER_ID)
    .execute();
}
