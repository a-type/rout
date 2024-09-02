import { Session } from '@a-type/auth';

export interface CtxVars {
  requestId: string;
  session: Session | null;
  gameSessionId: string;
}

export interface Env {
  Variables: CtxVars;
}
