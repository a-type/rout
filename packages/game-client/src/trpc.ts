import { AppRouter } from '@long-game/trpc';
import { TRPCLink, httpBatchLink } from '@trpc/client';
import { observable, tap } from '@trpc/server/observable';

export const loginLink = (opts: { loginUrl: string }): TRPCLink<AppRouter> => {
  return () => {
    return ({ op, next }) => {
      return observable((observer) => {
        return next(op)
          .pipe(
            tap({
              next(value) {
                observer.next(value);
              },
              error(result) {
                if (result.data?.code === 'UNAUTHORIZED') {
                  // avoid loop
                  if (
                    window.location.href !== opts.loginUrl &&
                    window.location.pathname !== opts.loginUrl
                  ) {
                    window.location.href = opts.loginUrl;
                  }
                }
              },
            }),
          )
          .subscribe(observer);
      });
    };
  };
};

export const fetchLink = (host: string) =>
  httpBatchLink({
    url: host + '/trpc',
    fetch: (input, init) => {
      return fetch(input, {
        ...init,
        credentials: 'include',
      });
    },
  });
