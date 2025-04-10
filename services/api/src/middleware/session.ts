import { Session } from '@a-type/auth';
import { assertPrefixedId, LongGameError, PrefixedId } from '@long-game/common';
import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { UserStore } from '../../../db/src/index.js';
import { sessions } from '../auth/session.js';
import { Env } from '../config/ctx.js';

export type SessionWithPrefixedIds = Omit<Session, 'userId'> & {
  userId: PrefixedId<'u'>;
};

async function getRequestSessionOrThrow(
  ctx: Context,
): Promise<SessionWithPrefixedIds> {
  let session: Session | null = null;
  session = await sessions.getSession(ctx);

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
    userStore: Rpc.Stub<UserStore>;
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

/**
 * Only useful for endpoints that may be public or private.
 * Other middleware exported from this module is more convenient
 * by ensuring logged in status and/or providing userStore.
 */
export const sessionMiddleware = createMiddleware<{
  Variables: {
    session: SessionWithPrefixedIds | null;
  };
  Bindings: Env['Bindings'];
}>(async (ctx, next) => {
  let session: SessionWithPrefixedIds | null = null;
  try {
    session = await getRequestSessionOrThrow(ctx);
  } catch (err) {
    if (err instanceof LongGameError) {
      if (err.code === LongGameError.Code.Unauthorized) {
        return next();
      }
    }
    throw err;
  }
  ctx.set('session', session);
  return next();
});
