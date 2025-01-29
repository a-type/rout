import { hc } from 'hono/client';
import type { AppType } from './index.js';

const client = hc<AppType>('');
export type Client = typeof client;
export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);
