import { Service } from '@cloudflare/workers-types';
import { SessionWithPrefixedIds } from '../../../common/middleware/session';
import type { AdminStore, PublicStore } from '../../../db-service/src';
import { GameSessionState } from '../../../game-session-service/src';

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
