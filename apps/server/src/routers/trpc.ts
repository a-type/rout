import { Router } from 'itty-router';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@long-game/trpc';
import { DEPLOYED_CONTEXT } from '../deployedContext.js';

export const trpcRouter = Router({
  base: '/trpc',
});

trpcRouter.all('*', (req) => {
  const res = new Response(null, {
    status: 200,
  });

  return fetchRequestHandler({
    req,
    endpoint: '/trpc',
    router: appRouter,
    createContext: async () => ({
      req,
      deployedContext: DEPLOYED_CONTEXT,
      res,
    }),
  });
});
