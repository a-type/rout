import { Hono, InferResponseType } from 'hono';
import { hc } from 'hono/client';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { handleError } from '../../common/middleware/errors';
import { sessionMiddleware } from '../../common/middleware/session';
import { authRouter } from './routers/auth';
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
  .use(sessionMiddleware)
  .get('/', (ctx) => ctx.text('Hello, world!'))
  .route('/auth', authRouter)
  .route('/users', usersRouter);
// .route('/gameSessions', gameSessionsRouter);
// .route('/friendships', friendshipsRouter);

export default app;

export type AppType = typeof app;

const client = hc<AppType>('http://localhost:3000');
const me = client.users.me.$get;
type Test = InferResponseType<typeof me>;
const root = client.index.$get;
type Test2 = InferResponseType<typeof root>;
