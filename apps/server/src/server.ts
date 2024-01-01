import { createServerAdapter } from '@whatwg-node/server';
import { createServer } from 'http';
import { error, json, Router, createCors, IRequest } from 'itty-router';

import { authRouter } from './routers/auth.js';
import { trpcRouter } from './routers/trpc.js';
import { DEPLOYED_CONTEXT } from './deployedContext.js';

const router = Router();

const { preflight } = createCors({
  headers: ['Authorization', 'Content-Type'],
  methods: ['GET', 'POST', 'OPTIONS'],
  origins: [DEPLOYED_CONTEXT.uiHost],
});

const logger = (req: IRequest) => {
  console.log(`[${req.method}] ${req.url}`);
};

router
  .all('*', preflight, logger)
  .get('/', () => 'Success!')
  .all('/auth/*', authRouter.handle)
  .all('/trpc/*', trpcRouter.handle)
  .all('*', () => error(404));

const ittyServer = createServerAdapter((request) =>
  router.handle(request).catch((reason) => {
    console.error(reason);
    return error(reason);
  }),
);

const httpServer = createServer(ittyServer);
const port = DEPLOYED_CONTEXT.apiHost.split(':')[2];
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
