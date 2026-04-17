import { normalizeVersion } from '@long-game/common';
import { Hono } from 'hono';

export default new Hono<{
  Bindings: GameRegistryBindings;
}>().all('/:gameId/:version/*', async (c) => {
  const { gameId, version } = c.req.param();

  // normalize version just in case
  const normalizedVersion = normalizeVersion(version);

  const bindingKey = `game--${gameId}--${normalizedVersion}`;

  const binding = c.env[bindingKey as keyof GameRegistryBindings] as Fetcher;
  if (!binding) {
    return c.text('Game not found', 404);
  }

  // forward to the appropriate game worker API
  const forwardedPath = c.req.path.replace(`/${gameId}/${version}`, '');
  // url origin is arbitrary.
  return binding.fetch(`http://localhost:8080${forwardedPath}`, {
    method: c.req.method,
    headers: {
      ...c.req.header(),
      'X-Rout-Forwarded': 'true',
    },
    body: c.req.raw.body,
  });
});
