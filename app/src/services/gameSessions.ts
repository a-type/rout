import type { AppType } from '@long-game/services/game-session';

import { hc } from 'hono/client';
import { fetch } from './fetch';

export const gameSessionApiClient = hc<AppType>(
  import.meta.env.VITE_GAME_SESSIONS_API_ORIGIN,
  {
    fetch,
  },
);
