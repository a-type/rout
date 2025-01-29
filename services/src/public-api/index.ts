import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { handleError } from '../middleware';
import { configuredCors } from '../middleware/cors';
import { authRouter } from './routers/auth';
import { friendshipsRouter } from './routers/friendships';
import { gameSessionInvitationsRouter } from './routers/gameSessionInvitations';
import { gameSessionsRouter } from './routers/gameSessions';
import { socketRouter } from './routers/socket';
import { usersRouter } from './routers/users';

const app = new Hono()
  .onError(handleError)
  .use(requestId())
  .use(logger())
  .route('/socket', socketRouter)
  .use(configuredCors())
  .get('/', (ctx) => ctx.text('Hello, world!'))
  .route('/auth', authRouter)
  .route('/users', usersRouter)
  .route('/gameSessions', gameSessionsRouter)
  .route('/gameSessionInvitations', gameSessionInvitationsRouter)
  .route('/friendships', friendshipsRouter);

export default app;

export type AppType = typeof app;

export { GameSessionState } from './durableObjects/GameSessionState';
