import { Hono } from 'hono';
import { Env } from '../../config/ctx';
import { adminGameProductsRouter } from './adminGameProductsRouter';

export const adminRouter = new Hono<Env>().route(
  '/gameProducts',
  adminGameProductsRouter,
);
