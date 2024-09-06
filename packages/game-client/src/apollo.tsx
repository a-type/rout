import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  from,
  split,
} from '@apollo/client';
import { ErrorHandler, onError } from '@apollo/client/link/error';
import { HttpLink } from '@apollo/client/link/http';
import { RetryLink } from '@apollo/client/link/retry';
import { LongGameError } from '@long-game/common';
import * as CONFIG from './config.js';
import { fetch, refreshSession } from './fetch.js';
import { createSse } from './apollo/sseLink.js';
import { FC, ReactNode } from 'react';
import { getMainDefinition } from '@apollo/client/utilities';

let hasNetworkError = false;

function createErrorHandler(
  onError?: (err: string) => void,
  onLoggedOut?: () => void,
): ErrorHandler {
  return ({ graphQLErrors, networkError, operation, forward }) => {
    let errorMessage: string | undefined =
      'An unexpected error occurred. Please try again.';
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        console.error('Error during op', operation.operationName, err);
        if (err.extensions?.longGameCode) {
          const code = err.extensions.longGameCode as number;
          if (
            code === LongGameError.Code.SessionExpired ||
            code === LongGameError.Code.Unauthorized
          ) {
            errorMessage = undefined;
            return operation.setContext(async () => {
              // attempt to refresh the session
              console.log('Attempting to refresh session');
              const success = await refreshSession(
                CONFIG.API_ORIGIN + '/auth/refresh',
              );
              if (success) {
                // retry the original request
                console.log(
                  'Session refreshed. Retrying original request',
                  operation.operationName,
                );
                return forward(operation);
              } else {
                console.error('Failed to refresh session');
                // failed to refresh the session - the user needs
                // to log in to use this query.
                onLoggedOut?.();
                return;
              }
            });
          } else if (code === LongGameError.Code.SessionInvalid) {
            // the session cookie should be removed now, so retry
            onLoggedOut?.();
            return operation.setContext(async () => {
              return forward(operation);
            });
          } else {
            errorMessage = err.message;
          }
        }
      }
    } else if (networkError) {
      if ('statusCode' in networkError && networkError.statusCode === 401) {
        errorMessage = undefined;
        operation.setContext(async () => {
          // attempt to refresh the session
          console.log('Attempting to refresh session');
          const success = await refreshSession(
            CONFIG.API_ORIGIN + '/auth/refresh',
          );
          if (success) {
            console.log(
              'Session refreshed. Retrying original request',
              operation.operationName,
            );
            // retry the original request
            return forward(operation);
          } else {
            console.error('Failed to refresh session');
            // failed to refresh the session - the user needs
            // to log in to use this query.
            onLoggedOut?.();
            return;
          }
        });
      } else if (!hasNetworkError) {
        hasNetworkError = true;
        console.error(networkError);
        if (networkError.message === 'Failed to fetch') {
          // errorMessage =
          //   'Having trouble reaching Biscuits servers. Running in offline mode.';
          // this is communicated through UserMenu
          errorMessage = undefined;
        } else {
          errorMessage =
            'A network error occurred. Please check your connection.';
        }
      } else {
        errorMessage = undefined;
      }
    }

    if (!networkError) {
      hasNetworkError = false;
    }

    if (errorMessage && !operation.getContext().hideErrors)
      onError?.(errorMessage);
  };
}

const createHttp = (origin: string) =>
  new HttpLink({
    fetch,
    credentials: 'include',
    uri: `${origin}/graphql`,
  });

const retry = new RetryLink({
  delay: {
    initial: 500,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 10,
    retryIf: (error, _operation) => {
      if (error.networkError) return true;

      return false;
    },
  },
});

export function createGraphQLClient({
  origin = CONFIG.API_ORIGIN,
  onError: errorHandler,
  onLoggedOut,
}: {
  origin?: string;
  onError?: (error: string) => void;
  onLoggedOut?: () => void;
} = {}) {
  const http = createHttp(origin);
  const sse = createSse(origin);
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    sse,
    http,
  );
  return new ApolloClient({
    uri: `${origin}/graphql`,
    cache: new InMemoryCache({}),
    link: from([
      onError(createErrorHandler(deduplicateErrors(errorHandler), onLoggedOut)),
      retry,
      splitLink,
    ]),
  });
}

export const defaultErrorHandlerRef = {
  onError: (error: string) => {
    console.error(error);
  },
  onLoggedOut: () => {
    window.location.href = CONFIG.HOME_ORIGIN + '/login';
  },
};

export const graphqlClient = createGraphQLClient(defaultErrorHandlerRef);

function deduplicateErrors(onError?: (error: string) => void) {
  if (!onError) return undefined;
  // only show 1 of each error message within a time window
  const errors = new Set<string>();
  return (error: string) => {
    if (errors.has(error)) return;
    errors.add(error);
    setTimeout(() => {
      errors.delete(error);
    }, 5000);
    onError(error);
  };
}

export {
  ApolloError,
  NetworkStatus,
  isApolloError as isClientError,
  useBackgroundQuery,
  useApolloClient as useClient,
  useFragment,
  useLazyQuery,
  useLoadableQuery,
  useMutation,
  useQuery,
  useReactiveVar,
  useReadQuery,
  useSubscription,
  useSuspenseQuery,
  ApolloProvider,
} from '@apollo/client';
export type * from '@apollo/client';

export const GameProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return <ApolloProvider client={graphqlClient}>{children}</ApolloProvider>;
};
