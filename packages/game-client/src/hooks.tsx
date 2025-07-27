import {
  QueryClientProvider,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryResult,
  UseSuspenseInfiniteQueryResult,
  useSuspenseQuery,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { createContext, ReactNode, useContext } from 'react';
import {
  BaseSdk,
  EraseEmptyArg,
  isInfiniteQueryFactory,
  isQueryFactory,
  QueryFactory,
  QueryFactoryInfinite,
} from './api/BaseSdk.js';

export { useMutation, useSuspenseQuery };

export type SdkHooks<Sdk extends BaseSdk> = {
  [K in keyof Sdk as `use${Capitalize<
    string & K
  >}`]: Sdk[K] extends QueryFactory<infer O, infer I>
    ? (...args: EraseEmptyArg<I>) => UseSuspenseQueryResult<O>
    : Sdk[K] extends QueryFactoryInfinite<infer O, infer I>
      ? (...args: EraseEmptyArg<I>) => UseSuspenseInfiniteQueryResult<O>
      : Sdk[K] extends UseMutationOptions<infer O, infer E, infer V>
        ? () => UseMutationResult<O, E, V>
        : never;
} & {
  // Lazy versions of queries
  [K2 in keyof Sdk as `use${Capitalize<string & K2>}Lazy`]: Sdk[K2] extends QueryFactory<
    infer O,
    infer I
  >
    ? (...args: EraseEmptyArg<I>) => UseQueryResult<O>
    : never;
};

function makeHookProxy<Sdk extends BaseSdk>(): any {
  return new Proxy(
    {},
    {
      get(_, prop) {
        const [, methodName] = prop.toString().match(/^use(.*)$/) || [];
        if (!methodName) {
          throw new Error(`Invalid hook name: ${prop.toString()}`);
        }
        const isLazy = methodName.endsWith('Lazy');
        let correctedMethodName =
          methodName.charAt(0).toLowerCase() + methodName.slice(1);
        if (isLazy) {
          correctedMethodName = correctedMethodName.slice(0, -4);
        }
        // queries
        if (
          correctedMethodName.startsWith('get') ||
          correctedMethodName.startsWith('adminGet')
        ) {
          return (args: any) => {
            const sdk = useSdk() as Sdk;
            const method = sdk[correctedMethodName as keyof Sdk] as
              | QueryFactory<any, any>
              | QueryFactoryInfinite<any, any>;
            if (isQueryFactory(method)) {
              if (isLazy) {
                return useQuery(method(args));
              }
              return useSuspenseQuery(method(args));
            } else if (isInfiniteQueryFactory(method)) {
              return useSuspenseQuery(method(args));
            }
            throw new Error(
              `Method ${correctedMethodName} starts with 'get' but is not a query or infinite query`,
            );
          };
        } else {
          return () => {
            const sdk = useSdk() as Sdk;
            const method = sdk[
              correctedMethodName as keyof Sdk
            ] as UseMutationOptions<any, any, any>;
            return useMutation(method);
          };
        }
      },
    },
  );
}

export function hookifySdk<Sdk extends BaseSdk>(): SdkHooks<Sdk> {
  return makeHookProxy<Sdk>();
}

const SdkContext = createContext<BaseSdk | null>(null);

export const SdkProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: BaseSdk;
}) => {
  return (
    <QueryClientProvider client={value.queryClient}>
      <SdkContext.Provider value={value}>{children}</SdkContext.Provider>
    </QueryClientProvider>
  );
};
export function useSdk() {
  const sdk = useContext(SdkContext);
  if (!sdk) {
    throw new Error('useSdk must be used within a SdkProvider');
  }
  return sdk;
}
