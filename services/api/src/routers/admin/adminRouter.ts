import { Hono } from 'hono';
import { Env } from '../../config/ctx';
import { loggedInMiddleware } from '../../middleware';
import { adminMiddleware } from '../../middleware/admin';
import { adminGameProductsRouter } from './adminGameProductsRouter';
import { adminGameSessionsRouter } from './adminGameSessions';
import { adminUsersRouter } from './adminUsers';

export const adminRouter = new Hono<Env>()
  .use(loggedInMiddleware, adminMiddleware)
  .route('/users', adminUsersRouter)
  .route('/gameSessions', adminGameSessionsRouter)
  .route('/gameProducts', adminGameProductsRouter);
