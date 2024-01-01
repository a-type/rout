import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('User')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('fullName', 'text')
    .addColumn('friendlyName', 'text')
    .addColumn('email', 'text', (col) => col.unique().notNull())
    .addColumn('emailVerifiedAt', 'datetime')
    .addColumn('imageUrl', 'text')
    .execute();

  await db.schema
    .createTable('Account')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('userId', 'uuid', (col) =>
      col.references('User.id').onDelete('cascade').notNull(),
    )
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('provider', 'text', (col) => col.notNull())
    .addColumn('providerAccountId', 'text', (col) => col.notNull())
    .addColumn('refreshToken', 'text')
    .addColumn('accessToken', 'text')
    .addColumn('expiresAt', 'datetime')
    .addColumn('tokenType', 'text')
    .addColumn('scope', 'text')
    .addColumn('idToken', 'text')
    .execute();

  await db.schema
    .createTable('VerificationToken')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('token', 'text', (col) => col.notNull().unique())
    .addColumn('expiresAt', 'datetime', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('Account_userId_index')
    .on('Account')
    .column('userId')
    .execute();

  await db.schema
    .createTable('GameSession')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('timezone', 'text', (col) => col.notNull())
    .addColumn('gameId', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('GameMove')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) => col.notNull())
    .addColumn('updatedAt', 'datetime', (col) => col.notNull())
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

  await db.schema
    .createTable('GameSessionMembership')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('gameSessionId', 'text', (col) =>
      col.notNull().references('Plan.id').onDelete('cascade'),
    )
    .addColumn('inviterId', 'text', (col) =>
      col.notNull().references('Profile.id'),
    )
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('Profile.id').onDelete('cascade'),
    )
    .addColumn('expiresAt', 'datetime', (col) => col.notNull())
    .addColumn('claimedAt', 'datetime')
    .addColumn('status', 'text', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('ActivityLog').execute();
  await db.schema.dropTable('PasswordReset').execute();
  await db.schema.dropTable('EmailVerification').execute();
  await db.schema.dropTable('PlanInvitation').execute();
  await db.schema.dropTable('PlanMembership').execute();
  await db.schema.dropTable('Plan').execute();
  await db.schema.dropTable('Account').execute();
  await db.schema.dropTable('Profile').execute();
}
