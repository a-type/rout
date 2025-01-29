import type { AdminStore } from './stores/AdminStore.js';

export interface Env {
  D1: D1Database;
  STORE: Service<AdminStore>;
}
