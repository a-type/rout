import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../config/ctx';

export const adminGameSessionsRouter = new Hono<Env>().get(
  '/',
  zValidator(
    'query',
    z.object({
      before: z.string().optional(),
      limit: z.number().optional(),
    }),
  ),
  async (ctx) => {},
);
