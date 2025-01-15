import { GameSessionState } from '.';
import { PublicStore } from '../db';

export interface Env {
  PUBLIC_STORE: PublicStore;
  GAME_SESSION_STATE: DurableObjectNamespace<GameSessionState>;

  // secrets
  SOCKET_TOKEN_SECRET: string;
}
