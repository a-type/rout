import { LongGameError } from '@long-game/common';
import { createMiddleware } from 'hono/factory';
import { Env } from '../config/ctx';

export const adminMiddleware = createMiddleware<Env>(async (ctx, next) => {
  const session = ctx.get('session');
  if (!session) {
    throw new LongGameError(LongGameError.Code.Unauthorized);
  }
  if (!session.isProductAdmin) {
    throw new LongGameError(LongGameError.Code.Forbidden);
  }
  return next();
});
