import { LongGameError } from '@long-game/common';
import { ZodError } from 'zod';

export function handleError(reason: unknown): Response {
  if (LongGameError.isInstance(reason)) {
    if (reason.code > LongGameError.Code.InternalServerError) {
      console.error('Unexpected LongGameError:', reason);
    }
    return new Response(JSON.stringify(reason.body), {
      status: reason.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...reason.headers,
      },
    });
  }

  if (reason instanceof ZodError) {
    return new Response(JSON.stringify(reason.errors), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'x-long-game-error': LongGameError.Code.BadRequest.toString(),
      },
    });
  }

  console.error('Unknown error:', reason);
  return new Response('Internal Server Error', {
    status: 500,
    headers: {
      'Content-Type': 'text/plain',
      'x-long-game-error': LongGameError.Code.InternalServerError.toString(),
    },
  });
}
