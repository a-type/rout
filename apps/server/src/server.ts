import { createServerAdapter } from '@whatwg-node/server';
import { createServer } from 'http';
import { error, json, Router, createCors, IRequest } from 'itty-router';

import { authRouter } from './routers/auth.js';
import { trpcRouter } from './routers/trpc.js';
import { DEPLOYED_CONTEXT } from './deployedContext.js';
import { eventsRouter } from './routers/events.js';

const router = Router();

const { preflight, corsify } = createCors({
  origins: [DEPLOYED_CONTEXT.uiHost],
  headers: { 'Access-Control-Allow-Credentials': true },
});

const logger = (req: IRequest) => {
  console.log(`[${req.method}] ${req.url}`);
};

router
  .all('*', logger, preflight)
  .get('/', () => 'Success!')
  .all('/auth/*', authRouter.handle)
  .all('/trpc/*', trpcRouter.handle)
  .all('/events/*', eventsRouter.handle)
  .all('*', () => error(404));

const ittyServer = createServerAdapter((request) =>
  router
    .handle(request)
    .catch((reason) => {
      console.error(reason);
      return error(reason);
    })
    .then((res) => {
      if (res instanceof Response) return res;
      return json(res);
    })
    .then((res) => {
      return corsify(res);
    }),
);

const httpServer = createServer(ittyServer);
const port = DEPLOYED_CONTEXT.apiHost.split(':')[2];
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
