import { hc } from 'hono/client';
import type { AppType } from './api.js';

const client = hc<AppType>('');
export type Client = typeof client;
export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);

export type * from './socketProtocol.js';
