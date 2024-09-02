import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './routers/auth.js';
import { handleError } from './middleware/errors.js';
import { corsOrigins } from './config/cors.js';
import { graphqlRouter } from './routers/graphql.js';

export const app = new Hono()
  .onError(handleError)
  .use(
    cors({
      origin: corsOrigins,
      credentials: true,
      allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      exposeHeaders: [
        'Content-Type',
        'Content-Length',
        'X-Request-Id',
        'Set-Cookie',
      ],
    }),
  )
  .use(logger())
  .get('/', (ctx) => ctx.text('Hello, world!'))
  .route('/auth', authRouter)
  .route('/graphql', graphqlRouter);

export type AppType = typeof app;
