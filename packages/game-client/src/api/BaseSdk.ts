import { LongGameError } from '@long-game/common';
import { hcWithType as apiHc } from '@long-game/service-api/client';
import {
  InfiniteData,
  UseMutationOptions,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { API_ORIGIN } from '../config.js';
import { fetch } from '../fetch.js';
import { queryClient } from '../queryClient.js';

type TypedResponse<T> = Response & { json: () => Promise<T> };
export type EraseEmptyArg<T, TEnd = never> = T extends void
  ? [TEnd] | []
  : [T, TEnd] | [T];
export type QueryOptions = Pick<
  UseSuspenseQueryOptions,
  | 'refetchInterval'
  | 'refetchIntervalInBackground'
  | 'refetchOnMount'
  | 'refetchOnReconnect'
  | 'refetchOnWindowFocus'
>;
export type QueryFactory<Output, Input> = {
  (...args: EraseEmptyArg<Input>): UseSuspenseQueryOptions<Output>;
  __isQuery: true;
  run: (input: Input) => Promise<Output>;
};
export type QueryFactoryInfinite<Output, Input> = {
  (
    ...args: EraseEmptyArg<Input>
  ): UseSuspenseInfiniteQueryOptions<
    Output,
    Error,
    Output,
    any,
    string | undefined
  >;
  __isInfiniteQuery: true;
  run: (input: Input) => Promise<InfiniteData<Output>>;
};

export const isQueryFactory = (
  factory: any,
): factory is QueryFactory<any, any> => {
  return (factory as any).__isQuery === true;
};

export const isInfiniteQueryFactory = (
  factory: any,
): factory is QueryFactoryInfinite<any, any> => {
  return (factory as any).__isInfiniteQuery === true;
};

export class BaseSdk extends EventTarget {
  protected readonly apiRpc: ReturnType<typeof apiHc>;

  readonly queryClient = queryClient;

  constructor() {
    super();
    this.apiRpc = apiHc(API_ORIGIN, { fetch });
  }

  protected sdkQuery = <TReq, TRes, Output = TRes, Input = void>(
    key: string,
    fn: (req: TReq) => Promise<TypedResponse<TRes>>,
    {
      transformInput,
      transformOutput,
      getKey,
      enabled,
      defaults,
    }: {
      transformInput?: (input: Input) => TReq;
      transformOutput?: (output: TRes) => Output;
      getKey?: (input: Input) => any[];
      enabled?: (input: Input) => boolean;
      defaults?: Partial<QueryOptions>;
    } = {},
  ): QueryFactory<Output, Input> => {
    const factory = (...args: EraseEmptyArg<Input>) => {
      const input = transformInput ? (args[0] as Input) : (undefined as Input);
      const options = transformInput
        ? (args[1] as QueryOptions | undefined)
        : (args[0] as QueryOptions | undefined);
      const queryFn = async () => {
        try {
          const res = await fn(
            transformInput ? transformInput(input) : (undefined as any),
          );
          LongGameError.throwIfError(res);
          const body = (await res.json()) as TRes;
          const result = transformOutput
            ? transformOutput(body)
            : (body as any as Output);

          return result;
        } catch (e) {
          console.error(e);
          this.dispatchEvent(new ErrorEvent('error', { error: e }));
          if (LongGameError.isInstance(e)) {
            throw e;
          }
          throw new LongGameError(
            LongGameError.Code.Unknown,
            'An error occurred. Please try again later.',
          );
        }
      };
      const subkey = getKey ? getKey(input) : [input];
      return {
        queryFn,
        queryKey: [key, ...subkey],
        enabled: enabled ? enabled(input) : true,
        ...defaults,
        ...options,
      } as UseSuspenseQueryOptions<Output>;
    };
    factory.__isQuery = true as const;
    factory.run = async (input: Input) => {
      const result = await this.queryClient.fetchQuery(
        factory(...([input] as EraseEmptyArg<Input>)),
      );
      return result;
    };
    return factory;
  };
  protected manualQuery = <Output, Input = void>(
    key: string,
    fn: (input: Input) => Promise<Output>,
  ): QueryFactory<Output, Input> => {
    const factory = (...args: EraseEmptyArg<Input>) => {
      const input = args[0] as Input;
      return {
        queryFn: () => fn(input),
        queryKey: [key, input],
      };
    };
    factory.__isQuery = true as const;
    factory.run = async (input: Input) => {
      const result = await this.queryClient.fetchQuery(
        factory(...([input] as EraseEmptyArg<Input>)),
      );
      return result;
    };
    return factory;
  };
  protected sdkInfiniteQuery = <
    TReq,
    TRes extends {
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
    },
    Output extends {
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
    } = TRes,
    Input = void,
  >(
    key: string,
    fn: (req: TReq, cursor: string | undefined) => Promise<TypedResponse<TRes>>,
    {
      transformInput,
      transformOutput,
      getKey,
      enabled,
      defaults,
    }: {
      transformInput?: (input: Input) => TReq;
      transformOutput?: (output: TRes) => Output;
      getKey?: (input: Input) => any[];
      enabled?: (input: Input) => boolean;
      defaults?: Partial<QueryOptions>;
    } = {},
  ): QueryFactoryInfinite<Output, Input> => {
    const factory = (...args: EraseEmptyArg<Input>) => {
      const input = args[0] as Input;
      const options = args[1] as unknown as QueryOptions;
      const queryFn = async ({
        pageParam,
      }: {
        pageParam: string | undefined;
      }) => {
        try {
          const res = await fn(
            transformInput ? transformInput(input) : (undefined as any),
            pageParam,
          );
          LongGameError.throwIfError(res);
          const body = (await res.json()) as TRes;
          const result = transformOutput
            ? transformOutput(body)
            : (body as any as Output);

          return result;
        } catch (e) {
          console.error(e);
          this.dispatchEvent(new ErrorEvent('error', { error: e }));
          if (LongGameError.isInstance(e)) {
            throw e;
          }
          throw new LongGameError(
            LongGameError.Code.Unknown,
            'An error occurred. Please try again later.',
          );
        }
      };
      const subkey = getKey ? getKey(input) : [input];
      return {
        queryFn,
        queryKey: [key, ...subkey],
        enabled: enabled ? enabled(input) : true,
        ...defaults,
        ...options,
        getNextPageParam: (lastPage) => {
          if (lastPage.pageInfo) {
            return lastPage.pageInfo.endCursor;
          }
          return undefined;
        },
        initialPageParam: undefined,
      } as UseSuspenseInfiniteQueryOptions<
        Output,
        Error,
        Output,
        any,
        string | undefined
      >;
    };
    factory.__isInfiniteQuery = true as const;
    factory.run = async (input: Input) => {
      const result = await this.queryClient.fetchInfiniteQuery(
        factory(...([input] as EraseEmptyArg<Input>)),
      );
      return result;
    };
    return factory;
  };

  protected fetch = this.queryClient.fetchQuery.bind(this.queryClient);
  protected optimisticUpdate = <Output>(
    query: UseSuspenseQueryOptions<Output>,
    updater: (data: Output) => Output,
  ) => {
    this.queryClient.setQueryData(query.queryKey, updater);
  };

  protected sdkMutation = <TReq, TRes, Input = undefined, Output = TRes>(
    fn: (req: TReq) => Promise<TypedResponse<TRes>>,
    {
      transformInput,
      transformOutput,
      invalidate,
      onSuccess,
    }: {
      transformInput?: (input: Input) => TReq;
      transformOutput?: (output: TRes) => Output;
      invalidate?: any[][];
      onSuccess?: (output: Output, vars: Input) => void;
    } = {},
  ): UseMutationOptions<Output, any, Input> => {
    const mutationFn = async (args: Input) => {
      try {
        const res = await fn(
          transformInput ? transformInput(args) : (undefined as any),
        );
        LongGameError.throwIfError(res);
        const body = (await res.json()) as TRes;
        const result = transformOutput
          ? transformOutput(body)
          : (body as any as Output);

        return result;
      } catch (e) {
        console.error(e);
        this.dispatchEvent(new ErrorEvent('error', { error: e }));
        if (LongGameError.isInstance(e)) {
          throw e;
        }
        throw new LongGameError(
          LongGameError.Code.Unknown,
          'An error occurred. Please try again later.',
        );
      }
    };
    return {
      mutationFn,
      onSuccess: (output, vars) => {
        if (invalidate) {
          for (const key of invalidate) {
            this.queryClient.invalidateQueries({ queryKey: key });
          }
        }
        onSuccess?.(output, vars);
      },
    };
  };
  manualMutation = <Output, Input = void>(
    fn: (input: Input) => Promise<Output>,
    {
      onSuccess,
      invalidate,
    }: {
      onSuccess?: (output: Output, vars: Input) => void;
      invalidate?: any[][];
    } = {},
  ): UseMutationOptions<Output, any, Input> => {
    const mutationFn = async (args: Input) => {
      try {
        return await fn(args);
      } catch (e) {
        console.error(e);
        if (LongGameError.isInstance(e)) {
          throw e;
        }
        throw new LongGameError(
          LongGameError.Code.Unknown,
          'An error occurred. Please try again later.',
        );
      }
    };
    return {
      mutationFn,
      onSuccess: (data, vars, ctx) => {
        invalidate?.forEach((key) => {
          this.queryClient.invalidateQueries({ queryKey: key });
        });
        onSuccess?.(data, vars);
      },
    };
  };
  run = async <Output, Input>(
    mutation: UseMutationOptions<Output, any, Input>,
    input: Input,
  ) => {
    const result = await mutation.mutationFn!(input, undefined as any);
    mutation.onSuccess?.(result, input, undefined, undefined as any);
  };
}

export type InferReturnData<T> = T extends (
  ...args: any
) => UseSuspenseQueryOptions<infer U>
  ? U
  : T extends QueryFactoryInfinite<infer U, any>
    ? U
    : T extends () => UseMutationOptions<infer U>
      ? U
      : never;

export type InferInput<T> = T extends (
  ...args: infer U
) => UseSuspenseQueryOptions<any>
  ? U
  : T extends () => UseMutationOptions<any, any, infer U>
    ? U
    : never;
