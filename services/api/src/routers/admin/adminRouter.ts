import { Hono } from 'hono';
import { Env } from '../../config/ctx';
import { adminMiddleware } from '../../middleware/admin';
import { adminGameProductsRouter } from './adminGameProductsRouter';

export const adminRouter = new Hono<Env>()
  .use(adminMiddleware)
  .route('/gameProducts', adminGameProductsRouter);
