import { GoogleProvider, createHandlers } from '@a-type/auth';
import {
  comparePassword,
  db,
  hashPassword,
  id,
  PrefixedId,
} from '@long-game/db';
import { sessions } from '../auth/session.js';
import { DEPLOYED_CONTEXT } from '../config/deployedContext.js';
import { email } from '../services/email.js';
import {
  GOOGLE_AUTH_CLIENT_ID,
  GOOGLE_AUTH_CLIENT_SECRET,
} from '../config/secrets.js';

export const authHandlers = createHandlers({
  sessions,
  returnToOrigin: DEPLOYED_CONTEXT.uiHost,
  providers: {
    google: new GoogleProvider({
      clientId: GOOGLE_AUTH_CLIENT_ID,
      clientSecret: GOOGLE_AUTH_CLIENT_SECRET,
      redirectUri: DEPLOYED_CONTEXT.apiHost + '/auth/provider/google/callback',
    }),
  },
  addProvidersToExistingUsers: true,
  defaultReturnToPath: '/',
  email: email,
  db: {
    getAccountByProviderAccountId: async (providerName, providerAccountId) => {
      const dbAccount = await db
        .selectFrom('Account')
        .where('provider', '=', providerName)
        .where('providerAccountId', '=', providerAccountId)
        .selectAll()
        .executeTakeFirst();

      if (!dbAccount) {
        return undefined;
      }

      return {
        ...dbAccount,
        expiresAt: dbAccount.accessTokenExpiresAt?.getTime() ?? null,
      };
    },
    getUserByEmail: async (email) => {
      return db
        .selectFrom('User')
        .where('email', '=', email)
        .selectAll()
        .executeTakeFirst();
    },
    insertAccount: async ({ expiresAt, userId, ...account }) => {
      return db
        .insertInto('Account')
        .values({
          id: id('a'),
          accessTokenExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
          userId: userId as PrefixedId<'u'>,
          ...account,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
    },
    insertUser: async ({
      plaintextPassword,
      fullName,
      friendlyName,
      ...user
    }) => {
      const password = plaintextPassword
        ? await hashPassword(plaintextPassword)
        : undefined;
      return db.transaction().execute(async (tx) => {
        const userResult = await tx
          .insertInto('User')
          .values({
            id: id('u'),
            password,
            fullName: fullName || 'Anonymous',
            friendlyName: friendlyName || 'Anonymous',
            acceptedTosAt: new Date(),
            ...user,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        return userResult;
      });
    },
    insertVerificationCode: async ({ expiresAt, ...verificationCode }) => {
      await db
        .insertInto('VerificationCode')
        .values({
          id: id('vc'),
          expiresAt: new Date(expiresAt),
          ...verificationCode,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
    },
    getVerificationCode: async (email, code) => {
      const value = await db
        .selectFrom('VerificationCode')
        .where('code', '=', code)
        .where('email', '=', email)
        .selectAll()
        .executeTakeFirst();

      if (!value) {
        return undefined;
      }

      return {
        ...value,
        expiresAt: value.expiresAt.getTime(),
      };
    },
    consumeVerificationCode: async (id) => {
      await db
        .deleteFrom('VerificationCode')
        .where('id', '=', id as PrefixedId<'vc'>)
        .execute();
    },
    getUserByEmailAndPassword: async (email, plaintextPassword) => {
      const user = await db
        .selectFrom('User')
        .where('email', '=', email)
        .selectAll()
        .executeTakeFirst();

      if (!user?.password) {
        return undefined;
      }

      if (!(await comparePassword(plaintextPassword, user.password))) {
        return undefined;
      }

      return user;
    },
    updateUser: async (id, { plaintextPassword, ...user }) => {
      const password = plaintextPassword
        ? await hashPassword(plaintextPassword)
        : undefined;
      await db
        .updateTable('User')
        .where('id', '=', id as PrefixedId<'u'>)
        .set({
          fullName: user.fullName ?? undefined,
          emailVerifiedAt: user.emailVerifiedAt ?? undefined,
          friendlyName: user.friendlyName ?? undefined,
          imageUrl: user.imageUrl ?? undefined,
          password,
        })
        .executeTakeFirstOrThrow();
    },
  },
});
