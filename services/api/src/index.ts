import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { configuredCors } from './middleware/cors.js';
import { handleError } from './middleware/index.js';
import { adminRouter } from './routers/admin/adminRouter.js';
import { authRouter } from './routers/auth.js';
import { friendshipsRouter } from './routers/friendships.js';
import { gamesRouter } from './routers/games.js';
import { gameSessionInvitationsRouter } from './routers/gameSessionInvitations.js';
import { gameSessionsRouter } from './routers/gameSessions.js';
import { notificationsRouter } from './routers/notifications.js';
import { publicRouter } from './routers/public.js';
import { pushRouter } from './routers/push.js';
import { socketRouter } from './routers/socket.js';
import { stripeRouter } from './routers/stripe.js';
import { subscriptionRouter } from './routers/subscription.js';
import { usersRouter } from './routers/users.js';

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
  .route('/friendships', friendshipsRouter)
  .route('/push', pushRouter)
  .route('/notifications', notificationsRouter)
  .route('/public', publicRouter)
  .route('/stripe', stripeRouter)
  .route('/games', gamesRouter)
  .route('/subscription', subscriptionRouter)
  .route('/admin', adminRouter);

export default app;

export type AppType = typeof app;

export { GameSession } from './durableObjects/gameSession/GameSession.js';
