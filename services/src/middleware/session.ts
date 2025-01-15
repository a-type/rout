import { AuthError, Session } from '@a-type/auth';
import { assertPrefixedId, LongGameError, PrefixedId } from '@long-game/common';
import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { AuthedStore } from '../db/index.js';
import { sessions } from '../public-api/auth/session.js';
import { Env } from '../public-api/config/ctx.js';

export type SessionWithPrefixedIds = Omit<Session, 'userId'> & {
  userId: PrefixedId<'u'>;
};

async function getRequestSessionOrThrow(
  ctx: Context,
): Promise<SessionWithPrefixedIds> {
  let session: Session | null = null;
  try {
    session = await sessions.getSession(ctx);
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.message === AuthError.Messages.SessionExpired) {
        throw new LongGameError(
          LongGameError.Code.SessionExpired,
          'Session expired. Please refresh your session or log in again.',
        );
      }
    }
    throw err;
  }

  if (!session) {
    throw new LongGameError(
      LongGameError.Code.Unauthorized,
      'You must be logged in to access this functionality.',
    );
  }

  const userId = session.userId;
  assertPrefixedId(userId, 'u');
  return {
    ...session,
    userId,
  };
}

export const loggedInMiddleware = createMiddleware<{
  Variables: {
    session: SessionWithPrefixedIds;
  };
  Bindings: Env['Bindings'];
}>(async (ctx, next) => {
  const session = await getRequestSessionOrThrow(ctx);
  ctx.set('session', session);
  return next();
});

export const userStoreMiddleware = createMiddleware<{
  Variables: {
    userStore: Rpc.Stub<AuthedStore>;
    session: SessionWithPrefixedIds;
  };
  Bindings: Env['Bindings'];
}>(async (ctx, next) => {
  const session = await getRequestSessionOrThrow(ctx);
  ctx.set('session', session);
  const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(session.userId);
  ctx.set('userStore', userStore);
  return next();
});
