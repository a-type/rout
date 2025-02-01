import type { AdminStore, PublicStore } from '../../db';
import { SessionWithPrefixedIds } from '../../middleware';
import type { GameSessionState } from '../durableObjects/GameSessionState';

export interface Bindings {
  // env
  GOOGLE_AUTH_CLIENT_ID: string;
  GOOGLE_AUTH_CLIENT_SECRET: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  UI_ORIGIN: string;
  API_ORIGIN: string;
  EMAIL_FROM: string;
  NODE_ENV: string;
  SESSION_SECRET: string;
  SOCKET_TOKEN_SECRET: string;

  // services
  PUBLIC_STORE: Service<PublicStore>;
  ADMIN_STORE: Service<AdminStore>;
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
