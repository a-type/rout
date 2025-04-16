import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersProject({
  test: {
    dir: './tests',
    poolOptions: {
      workers: {
        main: './api/dist/index.js',
        wrangler: {
          configPath: './api/wrangler.toml',
        },
        miniflare: {
          compatibilityDate: '2025-01-01',
          compatibilityFlags: ['nodejs_compat'],
          serviceBindings: {
            PUBLIC_STORE: 'long-game-service-db',
            ADMIN_STORE: 'long-game-service-db',
          },
          workers: [
            {
              name: 'long-game-service-db',
              scriptPath: './db/dist/index.js',
              modules: true,
              compatibilityDate: '2025-01-01',
              compatibilityFlags: ['nodejs_compat'],
            },
          ],
        },
      },
    },
  },
});
