import { SessionManager } from '@a-type/auth';
import { db, userNameSelector } from '@long-game/db';
import { LongGameError } from '@long-game/common';
import { SESSION_SECRET } from '../secrets.js';
import { DEPLOYED_CONTEXT } from '../config/deployedContext.js';

declare module '@a-type/auth' {
  interface Session {
    userId: string;
    name: string | null;
  }
}

export const sessions = new SessionManager({
  cookieName: 'lg-session',
  cookieOptions: {
    sameSite: 'lax',
  },
  expiration: process.env.NODE_ENV === 'production' ? '1d' : '1m',
  async createSession(userId) {
    const user = await db
      .selectFrom('User')
      .where('id', '=', userId)
      .select(['id'])
      .select(userNameSelector)
      .executeTakeFirst();

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
  secret: SESSION_SECRET,
  shortNames: {
    userId: 'sub',
    name: 'name',
  },
  audience: DEPLOYED_CONTEXT.uiHost,
  issuer: DEPLOYED_CONTEXT.apiHost,
  mode: 'production',
  refreshPath: '/auth/refresh',
  refreshTokenCookieName: 'lg-refresh',
});
