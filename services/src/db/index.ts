import { WorkerEntrypoint } from 'cloudflare:workers';
import { Env } from './env.js';

export { AdminStore } from './stores/AdminStore.js';
export { PublicStore } from './stores/PublicStore.js';
export { UserStore } from './stores/UserStore.js';

// default service API just provides a healthcheck for the database connection
export default class extends WorkerEntrypoint<Env> {
  async fetch() {
    const ok = await this.env.STORE.healthCheck();
    return new Response(ok ? 'OK' : 'NOT OK', {
      status: ok ? 200 : 500,
    });
  }
}
