import { Kysely } from 'kysely';

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable('GameSession')
    .dropColumn('initialState')
    .execute();

  await db.schema
    .alterTable('ChatMessage')
    .addColumn('position', 'text')
    .execute();
  await db.schema
    .alterTable('ChatMessage')
    .addColumn('roundIndex', 'integer')
    .execute();
  await db.schema
    .alterTable('ChatMessage')
    .addColumn('sceneId', 'text')
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema
    .alterTable('GameSession')
    .addColumn('initialState', 'text')
    .execute();

  await db.schema
    .alterTable('ChatMessage')
    .dropColumn('position')
    .dropColumn('roundIndex')
    .dropColumn('sceneId')
    .execute();
}
