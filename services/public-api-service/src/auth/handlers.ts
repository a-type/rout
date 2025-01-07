import { createHandlers, GoogleProvider } from '@a-type/auth';
import { Context } from 'hono';
import { sessions } from '../auth/session.js';
import { Env } from '../config/ctx.js';
import { email } from '../services/email.js';

export const authHandlers = createHandlers<Context<Env>>({
  sessions,
  adapter: {
    getRawRequest(ctx) {
      return ctx.req.raw;
    },
  },
  getRedirectConfig: (ctx) => ({
    defaultReturnToOrigin: ctx.env.UI_ORIGIN,
  }),
  providers: {
    google: new GoogleProvider({
      getConfig(ctx) {
        return {
          clientId: ctx.env.GOOGLE_AUTH_CLIENT_ID,
          clientSecret: ctx.env.GOOGLE_AUTH_CLIENT_SECRET,
          redirectUri: ctx.env.API_ORIGIN + '/auth/provider/google/callback',
        };
      },
    }),
  },
  addProvidersToExistingUsers: true,
  defaultReturnToPath: '/',
  email,
  getStorage: (ctx) => ({
    async getAccountByProviderAccountId(provider, providerAccountId) {
      const value = await ctx.env.ADMIN_STORE.getAccountByProviderAccountId(
        provider,
        providerAccountId,
      );
      if (!value) return value;
      return {
        ...value,
        // weird shimming required for Dates...
        expiresAt: value.expiresAt
          ? new Date(await value.expiresAt.getTime())
          : null,
      };
    },
    async getUserByEmail(email) {
      const value = await ctx.env.ADMIN_STORE.getUserByEmail(email);
      if (!value) return value;
      return {
        ...value,
        // weird shimming required for Dates...
        emailVerifiedAt: value.emailVerifiedAt
          ? new Date(await value.emailVerifiedAt.getTime())
          : null,
      };
    },
    insertAccount(account) {
      return ctx.env.ADMIN_STORE.insertAccount(account);
    },
    insertUser(user) {
      return ctx.env.ADMIN_STORE.insertUser(user);
    },
    updateUser(userId, user) {
      return ctx.env.ADMIN_STORE.updateUser(userId, user);
    },
    consumeVerificationCode(code) {
      return ctx.env.ADMIN_STORE.consumeVerificationCode(code);
    },
    async getUserByEmailAndPassword(email, password) {
      const value = await ctx.env.ADMIN_STORE.getUserByEmailAndPassword(
        email,
        password,
      );
      if (!value) return value;
      return {
        ...value,
        // weird shimming required for Dates...
        emailVerifiedAt: value.emailVerifiedAt
          ? new Date(await value.emailVerifiedAt.getTime())
          : null,
      };
    },
    insertVerificationCode(data) {
      return ctx.env.ADMIN_STORE.insertVerificationCode(data);
    },
  }),
});
