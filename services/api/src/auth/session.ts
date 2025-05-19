import { SessionManager } from '@a-type/auth';
import { assertPrefixedId, LongGameError } from '@long-game/common';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';

declare module '@a-type/auth' {
  interface Session {
    userId: string;
    name: string | null;
    isProductAdmin?: boolean;
  }
}

export const sessions = new SessionManager<Context>({
  getSessionConfig(baseCtx) {
    const ctx = baseCtx as Context<Env>;
    const apiDomain = new URL(ctx.env.API_ORIGIN).hostname;
    let topLevelDomain = apiDomain.split('.').slice(-2).join('.');
    if (!topLevelDomain.includes('localhost')) {
      // if not local dev, increase cookie scope to subdomains
      topLevelDomain = '.' + topLevelDomain;
    }
    return {
      cookieName: 'lg-session',
      cookieOptions: {
        sameSite: 'lax',
        domain: topLevelDomain,
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
          isProductAdmin: user.isProductAdmin,
        };
      },
      secret: ctx.env.SESSION_SECRET,
      audience: ctx.env.UI_ORIGIN,
      issuer: ctx.env.API_ORIGIN,
      mode: 'production',
      refreshPath: ctx.env.API_ORIGIN.includes('localhost:3100')
        ? '/public-api/auth/refresh'
        : '/auth/refresh',
      refreshTokenCookieName: 'lg-refresh',
    };
  },
  shortNames: {
    userId: 'sub',
    name: 'name',
    isProductAdmin: 'pad',
  },
  adapter: {
    getRawRequest(ctx) {
      return ctx.req.raw;
    },
  },
});
