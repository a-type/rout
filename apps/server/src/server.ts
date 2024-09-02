import { DEPLOYED_CONTEXT } from './config/deployedContext.js';
import { migrateToLatest } from '@long-game/db';
import { serve } from '@hono/node-server';
import { app } from './app.js';

await migrateToLatest();

const port = process.env.PORT || DEPLOYED_CONTEXT.apiHost.split(':')[2];
serve({ fetch: app.fetch, port: parseInt(port, 10) }).addListener(
  'listening',
  () => {
    console.log(`Server listening on port ${port}`);
  },
);
