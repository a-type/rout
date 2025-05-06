import { Hono } from 'hono';
import { Env } from '../../config/ctx';
import { loggedInMiddleware } from '../../middleware';
import { adminMiddleware } from '../../middleware/admin';
import { adminGameProductsRouter } from './adminGameProductsRouter';
import { adminGameSessionsRouter } from './adminGameSessions';

export const adminRouter = new Hono<Env>()
  .use(loggedInMiddleware, adminMiddleware)
  .route('/gameSessions', adminGameSessionsRouter)
  .route('/gameProducts', adminGameProductsRouter);
