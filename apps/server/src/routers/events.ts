import { IRequestStrict, Router } from 'itty-router';
import { events } from '../services/events.js';
import { getLiveSession } from '@long-game/auth';
import { db } from '@long-game/db';

export const eventsRouter = Router<IRequestStrict>({
  base: '/events',
});

// events are separated by game session ID
eventsRouter.get('/:gameSessionId', async (req) => {
  const res = new Response(null, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
    status: 200,
  });
  // validate access to this game session ID
  const session = await getLiveSession(req, res);

  if (!session) {
    // user must log in to verify access to events
    return new Response(null, {
      status: 401,
    });
  }

  const membership = await db
    .selectFrom('GameSessionMembership')
    .where('gameSessionId', '=', req.params.gameSessionId)
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
      console.debug('Subscribing to', req.params.gameSessionId);
      unsubscribe = events.subscribe(req.params.gameSessionId, (event) => {
        controller.enqueue(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      });
    },
    cancel() {
      console.debug('Unsubscribing from', req.params.gameSessionId);
      unsubscribe?.();
    },
  });

  req.signal.addEventListener('abort', () => {
    console.debug('Aborting subscription to', req.params.gameSessionId);
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
