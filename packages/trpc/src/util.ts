import { TRPCError, initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { getSession } from '@long-game/auth';
import superjson from 'superjson';

type Context = {
  req: Request;
  res: Response;
  deployedContext: {
    apiHost: string;
    uiHost: string;
  };
  session?: {
    id: string;
    profileId: string;
  };
};

export const createContext = async ({
  req,
  res,
  deployedContext,
}: trpcExpress.CreateExpressContextOptions & {
  deployedContext: {
    apiHost: string;
    uiHost: string;
  };
}) => {
  return {
    req,
    res,
    deployedContext,
  };
};

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    console.error(shape);
    return shape;
  },
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const userProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  const session = await getSession(ctx.req, ctx.res);
  if (!session) {
    throw new TRPCError({
      message: 'Please log in',
      code: 'UNAUTHORIZED',
    });
  }
  return opts.next({
    ctx: {
      session,
    },
  });
});
