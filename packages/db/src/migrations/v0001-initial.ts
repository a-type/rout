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
    .addColumn('color', 'text')
    .addColumn('password', 'text')
    .addColumn('stripeCustomerId', 'text')
    .addColumn('acceptedTosAt', 'datetime')
    .addColumn('sendEmailUpdates', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
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
    .addColumn('accessTokenExpiresAt', 'text')
    .addColumn('tokenType', 'text')
    .addColumn('scope', 'text')
    .addColumn('idToken', 'text')
    .execute();

  await db.schema
    .createIndex('Account_userId_index')
    .on('Account')
    .column('userId')
    .execute();

  await db.schema
    .createTable('VerificationCode')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('code', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'datetime', (col) => col.notNull())
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

  await db.schema
    .createTable('GameSession')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) => col.notNull())
    .addColumn('updatedAt', 'datetime', (col) => col.notNull())
    .addColumn('timezone', 'text', (col) => col.notNull())
    .addColumn('gameId', 'text', (col) => col.notNull())
    .addColumn('initialState', 'text')
    .addColumn('startedAt', 'datetime')
    .addColumn('randomSeed', 'text', (col) => col.notNull().defaultTo('seed'))
    .addColumn('gameVersion', 'text')
    .execute();

  await db.schema
    .createTable('GameTurn')
    .addColumn('createdAt', 'datetime', (col) => col.notNull())
    .addColumn('updatedAt', 'datetime', (col) => col.notNull())
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

  await db.schema
    .createTable('GameSessionMembership')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) => col.notNull())
    .addColumn('updatedAt', 'datetime', (col) => col.notNull())
    .addColumn('gameSessionId', 'text', (col) =>
      col.notNull().references('GameSession.id').onDelete('cascade'),
    )
    .addColumn('inviterId', 'text', (col) =>
      col.notNull().references('User.id'),
    )
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('User.id').onDelete('cascade'),
    )
    .addColumn('expiresAt', 'datetime')
    .addColumn('claimedAt', 'datetime')
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

  await db.schema
    .createTable('ChatMessage')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn('updatedAt', 'datetime', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
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
  await db.schema.dropTable('GameSessionMembership').execute();
  await db.schema.dropTable('GameTurn').execute();
  await db.schema.dropTable('GameSession').execute();
  await db.schema.dropTable('VerificationToken').execute();
  await db.schema.dropTable('Account').execute();
  await db.schema.dropTable('User').execute();
  await db.schema.dropTable('Friendship').execute();
  await db.schema.dropTable('FriendshipView').execute();
  await db.schema.dropTable('ChatMessage').execute();
}
