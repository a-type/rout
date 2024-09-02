import { db } from '@long-game/db';
import { Hono } from 'hono';
import { Env } from '../../config/ctx.js';
import { events } from '../../services/events.js';

export const eventsRouter = new Hono<Env>().get('/', async (ctx) => {
  // validate access to this game session ID
  const session = ctx.get('session');

  if (!session) {
    // user must log in to verify access to events
    return new Response(null, {
      status: 401,
    });
  }

  const gameSessionId = ctx.get('gameSessionId');

  const membership = await db
    .selectFrom('GameSessionMembership')
    .where('gameSessionId', '=', gameSessionId)
    .where('userId', '=', session.userId)
    .select('id')
    .executeTakeFirst();

  if (!membership) {
    // don't leak existence of this game session id
    // to users without access (404)
    return new Response(null, {
      status: 404,
    });
  }

  let unsubscribe: (() => void) | undefined;
  const stream = new ReadableStream({
    start(controller) {
      console.debug('Subscribing to', gameSessionId);
      unsubscribe = events.subscribe(gameSessionId, (event) => {
        controller.enqueue(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      });
    },
    cancel() {
      console.debug('Unsubscribing from', gameSessionId);
      unsubscribe?.();
    },
  });

  ctx.req.raw.signal.addEventListener('abort', () => {
    console.debug('Aborting subscription to', gameSessionId);
    unsubscribe?.();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
    status: 200,
  });
});
