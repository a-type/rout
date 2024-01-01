import { Router } from 'itty-router';
import { GoogleProvider, createHandlers } from '@long-game/auth';
import { db, id } from '@long-game/db';

export const authRouter = Router({
  base: '/auth',
});

const handlers = createHandlers({
  providers: {
    google: new GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: '/auth/provider/google/callback',
    }),
  },
  db: {
    getAccountByProviderAccountId: async (providerName, providerAccountId) => {
      return db
        .selectFrom('Account')
        .where('provider', '=', providerName)
        .where('providerAccountId', '=', providerAccountId)
        .selectAll()
        .executeTakeFirstOrThrow();
    },
    getUserByEmail: async (email) => {
      return db
        .selectFrom('User')
        .where('email', '=', email)
        .selectAll()
        .executeTakeFirstOrThrow();
    },
    insertAccount: async (account) => {
      return db
        .insertInto('Account')
        .values({
          id: id(),
          ...account,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
    },
    insertUser: async (user) => {
      return db
        .insertInto('User')
        .values({
          id: id(),
          ...user,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
    },
  },
});

authRouter
  .post('/provider/:provider/login', (req) => {
    const provider = req.params.provider;
    return handlers.handleOAuthLoginRequest(req, { provider });
  })
  .get('/provider/:provider/callback', (req) => {
    const provider = req.params.provider;
    return handlers.handleOAuthCallbackRequest(req, { provider });
  })
  .post('/logout', handlers.handleLogoutRequest);
