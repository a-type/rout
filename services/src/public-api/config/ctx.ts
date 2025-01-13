import type { AdminStore, PublicStore } from '../../db';
import { GameSessionState } from '../../game-session';
import { SessionWithPrefixedIds } from '../../middleware';

export interface Bindings {
  // env
  GOOGLE_AUTH_CLIENT_ID: string;
  GOOGLE_AUTH_CLIENT_SECRET: string;
  UI_ORIGIN: string;
  API_ORIGIN: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  NODE_ENV: string;
  SESSION_SECRET: string;

  // services
  PUBLIC_STORE: PublicStore;
  ADMIN_STORE: AdminStore;
  GAME_SESSION_STATE: DurableObjectNamespace<GameSessionState>;
}

export interface CtxVars {
  requestId: string;
  session: SessionWithPrefixedIds | null;
  gameSessionId: string;
}

export interface Env {
  Variables: CtxVars;
  Bindings: Bindings;
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
