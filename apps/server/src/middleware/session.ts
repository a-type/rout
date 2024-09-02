import { createMiddleware } from 'hono/factory';
import { Env } from '../config/ctx.js';
import { sessions } from '../auth/session.js';
import { Session } from '@a-type/auth';
import { LongGameError } from '@long-game/common';

export const sessionMiddleware = createMiddleware<Env>(async (ctx, next) => {
  const session = await sessions.getSession(ctx.req.raw);
  ctx.set('session', session);
  return next();
});

export const loggedInMiddleware = createMiddleware<{
  Variables: {
    session: Session;
  };
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
