import { honoAdapter, SessionManager } from '@a-type/auth';
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
    const apiUrl = new URL(ctx.env.API_ORIGIN);
    const refreshPath = apiUrl.pathname.replace(/\/$/, '') + '/auth/refresh';
    return {
      cookieName: 'lg-session',
      cookieOptions: {
        sameSite: 'lax',
        domain: getRootDomain(ctx.env.API_ORIGIN),
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
      refreshPath,
      refreshTokenCookieName: 'lg-refresh',
      refreshTokenDurationMinutes: 60 * 24 * 30, // 30 days
    };
  },
  shortNames: {
    userId: 'sub',
    name: 'name',
    isProductAdmin: 'pad',
  },
  adapter: honoAdapter,
});

export function getRootDomain(url: string) {
  const parsed = new URL(url);
  const domainParts = parsed.hostname.split('.');
  if (domainParts.length > 2) {
    return domainParts.slice(-2).join('.');
  }
  return parsed.hostname;
}
