import { SessionWithPrefixedIds } from '../middleware';

export interface CtxVars {
  requestId: string;
  session: SessionWithPrefixedIds | null;
  gameSessionId: string;
}

export interface Env {
  Variables: CtxVars;
  Bindings: ApiBindings;
}

export type EnvWith<T extends keyof Env['Variables']> = Omit<
  Env,
  'Variables'
> & {
  Variables: {
    [K in T]: K extends T
      ? NonNullable<Env['Variables'][K]>
      : Env['Variables'][K];
  };
};
