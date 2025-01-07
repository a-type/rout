import type { AppType } from '@long-game/services/public-api';

import { hc, InferResponseType } from 'hono/client';
import { fetch } from './fetch.js';

export const publicApiClient = hc<AppType>(
  import.meta.env.VITE_PUBLIC_API_ORIGIN,
  {
    fetch,
  },
);

const me = publicApiClient.users.me.$get;
type Test = InferResponseType<typeof me>;
