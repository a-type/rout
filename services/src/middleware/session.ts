import { Session } from '@a-type/auth';
import { assertPrefixedId, LongGameError, PrefixedId } from '@long-game/common';
import { createMiddleware } from 'hono/factory';
import type { AuthedStore } from '../db';
import { sessions } from '../public-api/auth/session.js';
import { Env } from '../public-api/config/ctx.js';

export type SessionWithPrefixedIds = Omit<Session, 'userId'> & {
  userId: PrefixedId<'u'>;
};

export const sessionMiddleware = createMiddleware<Env>(async (ctx, next) => {
  let session: Session | null = null;
  try {
    session = await sessions.getSession(ctx);
  } catch (err) {
    if (err instanceof LongGameError) {
      if (err.code !== LongGameError.Code.Unauthorized) {
        console.error(err);
      }
    } else {
      console.error(err);
    }
  }
  if (session) {
    const userId = session.userId;
    assertPrefixedId(userId, 'u');
    ctx.set('session', {
      ...session,
      userId,
    });
  } else {
    ctx.set('session', null);
  }
  return next();
});

export const loggedInMiddleware = createMiddleware<{
  Variables: {
    session: SessionWithPrefixedIds;
    userStore: Rpc.Stub<AuthedStore>;
  };
  Bindings: Env['Bindings'];
}>(async (ctx, next) => {
  const session = ctx.get('session');
  if (!session) {
    throw new LongGameError(
      LongGameError.Code.Unauthorized,
      'You must be logged in to access this functionality.',
    );
  }
  return next();
});

export const userStoreMiddleware = createMiddleware<{
  Variables: {
    userStore: Rpc.Stub<AuthedStore>;
    session: SessionWithPrefixedIds;
  };
  Bindings: Env['Bindings'];
}>(async (ctx, next) => {
  const session = ctx.get('session');
  if (!session) {
    throw new LongGameError(
      LongGameError.Code.Unauthorized,
      'You must be logged in to access this functionality.',
    );
  }
  const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(session.userId);
  ctx.set('userStore', userStore as any);
  return next();
});
