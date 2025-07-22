import { Hono } from 'hono';
import { Env } from '../../config/ctx.js';
import { adminMiddleware } from '../../middleware/admin.js';
import { loggedInMiddleware } from '../../middleware/index.js';
import { adminGameProductsRouter } from './adminGameProductsRouter.js';
import { adminGameSessionsRouter } from './adminGameSessions.js';
import { adminUsersRouter } from './adminUsers.js';

export const adminRouter = new Hono<Env>()
  .use(loggedInMiddleware, adminMiddleware)
  .route('/users', adminUsersRouter)
  .route('/gameSessions', adminGameSessionsRouter)
  .route('/gameProducts', adminGameProductsRouter);
