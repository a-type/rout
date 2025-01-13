import { SessionManager } from '@a-type/auth';
import { assertPrefixedId, LongGameError } from '@long-game/common';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';

declare module '@a-type/auth' {
  interface Session {
    userId: string;
    name: string | null;
  }
}

export const sessions = new SessionManager<Context<Env>>({
  getSessionConfig(ctx) {
    return {
      cookieName: 'lg-session',
      cookieOptions: {
        sameSite: 'lax',
      },
      expiration: ctx.env.NODE_ENV === 'production' ? '1d' : '1m',
      async createSession(userId) {
        assertPrefixedId(userId, 'u');
        const user = await (
          await ctx.env.PUBLIC_STORE.getStoreForUser(userId)
        ).getSession();

        if (!user) {
          throw new LongGameError(
            LongGameError.Code.BadRequest,
            `Invalid session. User with ID ${userId} not found.`,
          );
        }

        return {
          userId,
          name: user.name,
        };
      },
      secret: ctx.env.SESSION_SECRET,
      audience: ctx.env.UI_ORIGIN,
      issuer: ctx.env.API_ORIGIN,
      mode: 'production',
      refreshPath: '/auth/refresh',
      refreshTokenCookieName: 'lg-refresh',
    };
  },
  shortNames: {
    userId: 'sub',
    name: 'name',
  },
  adapter: {
    getRawRequest(ctx) {
      return ctx.req.raw;
    },
  },
});
