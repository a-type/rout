import { cors } from 'hono/cors';

export function configuredCors() {
  return cors({
    origin: (origin, ctx) => {
      if (origin === ctx.env.UI_ORIGIN) {
        return origin;
      }
      return null;
    },
    credentials: true,
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'X-Request-Id',
      'X-Csrf-Token',
    ],
    exposeHeaders: [
      'Content-Type',
      'Content-Length',
      'X-Request-Id',
      'Set-Cookie',
      'X-Long-Game-Error',
      'X-Long-Game-Message',
      'X-Csrf-Token',
      'X-Auth-Error',
    ],
  });
}
