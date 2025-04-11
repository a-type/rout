import { LongGameError } from '@long-game/common';
import { hcWithType as apiHc } from '@long-game/service-api';
import {
  UseMutationOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { fetch } from '../fetch.js';
import { queryClient } from '../queryClient.jsx';

type TypedResponse<T> = Response & { json: () => Promise<T> };
export type EraseEmptyArg<T> = T extends undefined ? [] : [T];
export type QueryFactory<Output, Input> = {
  (...args: EraseEmptyArg<Input>): UseSuspenseQueryOptions<Output>;
  __isQuery: true;
};

export class BaseSdk extends EventTarget {
  protected readonly apiRpc: ReturnType<typeof apiHc>;

  readonly queryClient = queryClient;

  constructor() {
    super();
    this.apiRpc = apiHc(import.meta.env.VITE_PUBLIC_API_ORIGIN, { fetch });
  }

  protected sdkQuery = <TReq, TRes, Output = TRes, Input = void>(
    key: string,
    fn: (req: TReq) => Promise<TypedResponse<TRes>>,
    {
      transformInput,
      transformOutput,
    }: {
      transformInput?: (input: Input) => TReq;
      transformOutput?: (output: TRes) => Output;
    } = {},
  ): QueryFactory<Output, Input> => {
    const factory = (...args: EraseEmptyArg<Input>) => {
      const input = args[0] as Input;
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
      return {
        queryFn,
        queryKey: [key, input],
      } as UseSuspenseQueryOptions<Output>;
    };
    factory.__isQuery = true as const;
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
    const result = await mutation.mutationFn!(input);
    mutation.onSuccess?.(result, input, undefined);
  };
}

export type InferReturnData<T> = T extends (
  ...args: any
) => UseSuspenseQueryOptions<infer U>
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
