import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('User')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('fullName', 'text')
    .addColumn('friendlyName', 'text')
    .addColumn('email', 'text', (col) => col.unique().notNull())
    .addColumn('emailVerifiedAt', 'text')
    .addColumn('imageUrl', 'text')
    .execute();

  await db.schema
    .createIndex('User_email_index')
    .on('User')
    .column('email')
    .execute();

  await db.schema
    .createTable('Account')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('userId', 'uuid', (col) =>
      col.references('User.id').onDelete('cascade').notNull(),
    )
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('provider', 'text', (col) => col.notNull())
    .addColumn('providerAccountId', 'text', (col) => col.notNull())
    .addColumn('refreshToken', 'text')
    .addColumn('accessToken', 'text')
    .addColumn('expiresAt', 'text')
    .addColumn('tokenType', 'text')
    .addColumn('scope', 'text')
    .addColumn('idToken', 'text')
    .execute();

  await db.schema
    .createTable('VerificationToken')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('token', 'text', (col) => col.notNull().unique())
    .addColumn('expiresAt', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('Account_userId_index')
    .on('Account')
    .column('userId')
    .execute();

  await db.schema
    .createTable('GameSession')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('timezone', 'text', (col) => col.notNull())
    .addColumn('gameId', 'text', (col) => col.notNull())
    .addColumn('initialState', 'text')
    .addColumn('startedAt', 'text')
    .addColumn('randomSeed', 'text', (col) => col.notNull().defaultTo('seed'))
    .addColumn('gameVersion', 'text')
    .execute();

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

  await db.schema
    .createTable('GameSessionMembership')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('gameSessionId', 'text', (col) =>
      col.notNull().references('GameSession.id').onDelete('cascade'),
    )
    .addColumn('inviterId', 'text', (col) =>
      col.notNull().references('User.id'),
    )
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('User.id').onDelete('cascade'),
    )
    .addColumn('expiresAt', 'text')
    .addColumn('claimedAt', 'text')
    .addColumn('status', 'text', (col) => col.notNull())
    .execute();

  // each user can only be in a game session once
  await db.schema
    .createIndex('GameSessionMembership_gameSessionId_userId_index')
    .on('GameSessionMembership')
    .columns(['userId', 'gameSessionId'])
    .unique()
    .execute();

  await db.schema
    .createTable('Friendship')
    .addColumn('createdAt', 'text', (col) => col.notNull())
    .addColumn('updatedAt', 'text', (col) => col.notNull())
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('User.id').onDelete('cascade'),
    )
    .addColumn('friendId', 'text', (col) =>
      col.notNull().references('User.id').onDelete('cascade'),
    )
    .addColumn('status', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('Friendship_userId_friendId_pk', [
      'userId',
      'friendId',
    ])
    .execute();

  // the primary key of a friendship is userId + friendId
  await db.schema
    .createIndex('Friendship_userId_friendId_index')
    .on('Friendship')
    .column('userId')
    .column('friendId')
    .unique()
    .execute();

  // this view is used to get the list of friends for a user
  // regardless of friendship relation direction by using a union
  // of two queries.
  await db.schema
    .createView('FriendshipView')
    .as(
      sql`
      SELECT
        "Friendship"."userId" AS "userId",
        "Friendship"."friendId" AS "friendId",
        "Friendship"."status" AS "status",
        "Friendship"."createdAt" AS "createdAt",
        "Friendship"."updatedAt" AS "updatedAt"
      FROM "Friendship"
      UNION
      SELECT
        "Friendship"."friendId" AS "userId",
        "Friendship"."userId" AS "friendId",
        "Friendship"."status" AS "status",
        "Friendship"."createdAt" AS "createdAt",
        "Friendship"."updatedAt" AS "updatedAt"
      FROM "Friendship"
    `,
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('GameSessionMembership').execute();
  await db.schema.dropTable('GameMove').execute();
  await db.schema.dropTable('GameSession').execute();
  await db.schema.dropTable('VerificationToken').execute();
  await db.schema.dropTable('Account').execute();
  await db.schema.dropTable('User').execute();
}
