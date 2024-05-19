import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable('User')
    .addColumn('password', 'text')
    .addColumn('stripeCustomerId', 'text')
    .addColumn('acceptedTosAt', 'timestamp')
    .addColumn('sendEmailUpdates', 'boolean')
    .execute();

  await db.schema
    .alterTable('Account')
    .renameColumn('expiresAt', 'accessTokenExpiresAt')
    .execute();

  await db.schema.dropTable('VerificationToken').execute();

  await db.schema
    .createTable('VerificationCode')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('code', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('VerificationCode_code_index')
    .on('VerificationCode')
    .column('code')
    .execute();

  await db.schema
    .createIndex('VerificationCode_email_index')
    .on('VerificationCode')
    .column('email')
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema
    .alterTable('User')
    .dropColumn('password')
    .dropColumn('stripeCustomerId')
    .dropColumn('acceptedTosAt')
    .dropColumn('sendEmailUpdates')
    .execute();

  await db.schema
    .alterTable('Account')
    .renameColumn('accessTokenExpiresAt', 'expiresAt')
    .execute();

  await db.schema.dropTable('VerificationCode').execute();

  await db.schema
    .createTable('VerificationToken')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('token', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('VerificationToken_token_index')
    .on('VerificationToken')
    .column('token')
    .execute();

  await db.schema
    .createIndex('VerificationToken_email_index')
    .on('VerificationToken')
    .column('email')
    .execute();
}
