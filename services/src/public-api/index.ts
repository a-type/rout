import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { handleError } from '../middleware';
import { authRouter } from './routers/auth';
import { friendshipsRouter } from './routers/friendships';
import { gameSessionInvitationsRouter } from './routers/gameSessionInvitations';
import { gameSessionsRouter } from './routers/gameSessions';
import { usersRouter } from './routers/users';

const app = new Hono()
  .onError(handleError)
  .use(requestId())
  .use(
    cors({
      origin: (origin, ctx) => {
        if (origin === ctx.env.UI_ORIGIN) {
          return origin;
        }
        return null;
      },
      credentials: true,
      allowHeaders: [
        'Authorization',
        'Content-Type',
        'X-Request-Id',
        'X-Csrf-Token',
      ],
      exposeHeaders: [
        'Content-Type',
        'Content-Length',
        'X-Request-Id',
        'Set-Cookie',
        'X-Long-Game-Error',
        'X-Long-Game-Message',
        'X-Csrf-Token',
      ],
    }),
  )
  .use(logger())
  .get('/', (ctx) => ctx.text('Hello, world!'))
  .route('/auth', authRouter)
  .route('/users', usersRouter)
  .route('/gameSessions', gameSessionsRouter)
  .route('/gameSessionInvitations', gameSessionInvitationsRouter)
  .route('/friendships', friendshipsRouter);

export default app;

export type AppType = typeof app;
