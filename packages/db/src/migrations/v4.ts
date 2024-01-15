import { Kysely } from 'kysely';

export async function up(db: Kysely<any>) {
  // adds user color column
  await db.schema.alterTable('User').addColumn('color', 'text').execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.alterTable('User').dropColumn('color').execute();
}
