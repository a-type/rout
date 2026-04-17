import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createGameApi } from '../src';
import { testGameDefinition } from './testGameDefinition';

// mocks the game registry API
export default () => {
  const registryApi = createGameApi(
    {
      id: 'test-game',
      creators: [],
      title: 'Test Game',
      description: 'A game used for testing the game API',
      tags: [],
      versions: [
        {
          version: 'v1',
          devAPIPort: 7777,
          devUIPort: 7778,
        },
      ],
      aliasIds: [],
      prerelease: false,
      screenshots: [],
    },
    testGameDefinition,
  );

  // like the registry, we host on a path... just hardcoded...
  const app = new Hono().route('/test-game/v1', registryApi);

  const server = serve({
    fetch: app.fetch,
    port: 7777,
  });
  return () => {
    return server.close();
  };
};
