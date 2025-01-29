import { AuthError } from '@a-type/auth';
import { Context, Hono } from 'hono';
import { authHandlers } from '../auth/handlers.js';
import { Env } from '../config/ctx.js';

export const authRouter = new Hono<Env>()
  .post('/provider/:provider/login', (ctx) => {
    const provider = ctx.req.param('provider');
    try {
      return authHandlers.handleOAuthLoginRequest(ctx, { provider });
    } catch (err) {
      return routeAuthErrorsToUi('/login', ctx)(err as Error);
    }
  })
  .get('/provider/:provider/callback', (ctx) => {
    const provider = ctx.req.param('provider');
    return authHandlers
      .handleOAuthCallbackRequest(ctx, { provider })
      .catch(routeAuthErrorsToUi('/login', ctx));
  })
  .all('/logout', (ctx) =>
    authHandlers.handleLogoutRequest(ctx).catch(routeAuthErrorsToUi('/', ctx)),
  )
  .post('/begin-email-signup', (ctx) =>
    authHandlers
      .handleSendEmailVerificationRequest(ctx)
      .catch(routeAuthErrorsToUi('/login', ctx)),
  )
  .post('/complete-email-signup', (ctx) =>
    authHandlers
      .handleVerifyEmailRequest(ctx)
      .catch(routeAuthErrorsToUi('/login', ctx)),
  )
  .post('/email-login', (ctx) =>
    authHandlers
      .handleEmailLoginRequest(ctx)
      .catch(routeAuthErrorsToUi('/login', ctx)),
  )
  .post('/begin-reset-password', (ctx) =>
    authHandlers
      .handleResetPasswordRequest(ctx)
      .catch(routeAuthErrorsToUi('/login', ctx)),
  )
  .post('/complete-reset-password', (ctx) =>
    authHandlers
      .handleVerifyPasswordResetRequest(ctx)
      .catch(routeAuthErrorsToUi('/login', ctx)),
  )
  .post('/refresh', (ctx) => authHandlers.handleRefreshSessionRequest(ctx))
  .get('/session', (ctx) => authHandlers.handleSessionRequest(ctx));

function routeAuthErrorsToUi(path: string, ctx: Context<Env>) {
  return function (err: Error) {
    console.error(err);
    if (err instanceof AuthError) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${ctx.env.UI_ORIGIN}${path}?error=${encodeURIComponent(
            err.message,
          )}`,
        },
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${ctx.env.UI_ORIGIN}${path}?error=${encodeURIComponent(
          'Something went wrong. Try again?',
        )}`,
      },
    });
  };
}
