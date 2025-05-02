import { WorkerEntrypoint } from 'cloudflare:workers';

export { AdminStore } from './stores/AdminStore.js';
export { PublicStore } from './stores/PublicStore.js';
export { UserStore } from './stores/UserStore.js';

// default service API just provides a healthcheck for the database connection
export default class extends WorkerEntrypoint<DbBindings> {
  async fetch() {
    const ok = await this.env.ADMIN_STORE.healthCheck();
    return new Response(ok ? 'OK' : 'NOT OK', {
      status: ok ? 200 : 500,
    });
  }
}

export * from '@long-game/kysely';
