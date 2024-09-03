import { AuthError, ErrorMessages, Session } from '@a-type/auth';
import { useCSRFPrevention } from '@graphql-yoga/plugin-csrf-prevention';
import { LongGameError } from '@long-game/common';
import { db } from '@long-game/db';
import { GraphQLError } from 'graphql';
import { Plugin, createYoga, maskError } from 'graphql-yoga';
import { Hono } from 'hono';
import { sessions } from '../auth/session.js';
import { Env } from '../config/ctx.js';
import { GQLContext } from '../graphql/context.js';
import { createDataLoaders } from '../graphql/dataloaders.js';
import { schema } from '../graphql/schema.js';
import { pubsub } from '../services/pubsub.js';

function applyHeaders(): Plugin<{}, GQLContext> {
  return {
    onResponse: (payload) => {
      if (payload.serverContext) {
        payload.serverContext.auth.applyHeaders.forEach((value, key) => {
          payload.response.headers.append(key, value);
        });
      }
    },
  };
}

const yoga = createYoga<GQLContext>({
  schema,
  graphiql: true,
  maskedErrors: {
    maskError: (error, message, isDev) => {
      const originalError =
        'originalError' in (error as any)
          ? (error as any).originalError
          : error;
      if (LongGameError.isInstance(originalError)) {
        // log more details for server errors
        if (originalError.statusCode >= 500) {
          console.error(`[Internal Error]`, error);
        } else {
          // no need to log these I think.
          // console.debug(`[Validation Error]`, originalError.message);
        }
        return new GraphQLError(originalError.message, {
          extensions: {
            unexpected:
              originalError.code === LongGameError.Code.InternalServerError,
            longGameCode: originalError.code,
          },
        });
      } else {
        console.error(`[GraphQL Error]`, error);
      }
      return maskError(error, message, isDev);
    },
  },
  plugins: [
    applyHeaders(),
    useCSRFPrevention({
      requestHeaders: ['x-csrf-token'],
    }),
  ],
  fetchAPI: {
    Response: Response,
    Request: Request,
    Blob: Blob,
    ReadableStream: ReadableStream,
    fetch: fetch,
    Headers: Headers,
    FormData: FormData,
    TextDecoder: TextDecoder,
    TextEncoder: TextEncoder,
    TransformStream: TransformStream,
    URLSearchParams: URLSearchParams,
    WritableStream: WritableStream,
    URLPattern: URLPattern,
    URL: URL,
  },
});

export const graphqlRouter = new Hono<Env>().all('/', async (honoCtx) => {
  const auth = {
    applyHeaders: new Headers(),
    setLoginSession: async (ses: Session | null) => {
      if (ses) {
        const { headers } = await sessions.updateSession(ses);
        auth.applyHeaders = new Headers(headers);
      } else {
        const { headers } = sessions.clearSession();
        auth.applyHeaders = new Headers(headers);
      }
      // also update immediately in the context, so that
      // resolvers on return values can see the new session
      ctx.session = ses;
    },
  };

  // Getting user session
  let session: Session | null = null;
  try {
    session = await sessions.getSession(honoCtx.req.raw);
  } catch (e) {
    // if session expired, we need to tell the client to refresh it
    if (e instanceof AuthError) {
      if (e.message === ErrorMessages.SessionExpired) {
        console.error('Session expired');
        throw new LongGameError(
          LongGameError.Code.SessionExpired,
          'Session expired',
        );
      }
    }
    throw e;
  }

  const ctx: GQLContext = {
    session,
    db,
    auth,
    dataLoaders: createDataLoaders({
      db,
      session,
    }),
    hono: honoCtx,
    pubsub: pubsub,
  };

  const yogaResponse = await yoga.handle(honoCtx.req.raw, ctx);
  return yogaResponse;
});
