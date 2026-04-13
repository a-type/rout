import { serve } from '@hono/node-server';
import { createGameApi } from '../src';
import { testGameDefinition } from './testGameDefinition';

export default () => {
  const app = createGameApi(
    {
      id: 'test-game',
      creators: [],
      title: 'Test Game',
      description: 'A game used for testing the game API',
      tags: [],
      versions: [
        {
          version: 'v1',
          devPort: 7777,
        },
      ],
      aliasIds: [],
      prerelease: false,
      screenshots: [],
    },
    testGameDefinition,
  );

  const server = serve({
    fetch: app.fetch,
    port: 7777,
  });
  return () => {
    return server.close();
  };
};
