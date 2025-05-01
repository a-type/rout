import { zValidator } from '@hono/zod-validator';
import { assertPrefixedId, LongGameError } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { sessions } from '../auth/session';
import { Env } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';
import { getStripe } from '../services/stripe';

export const subscriptionRouter = new Hono<Env>()
  .post(
    '/purchase',
    zValidator(
      'form',
      z.object({
        returnTo: z.string().optional(),
      }),
    ),
    userStoreMiddleware,
    async (ctx) => {
      const userId = ctx.get('session').userId;

      const user = await ctx.get('userStore').getMe();
      if (!user) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'User not found',
        );
      }

      const stripe = getStripe(ctx.env);

      const prices = await stripe.prices.list({
        lookup_keys: ['gold'],
        expand: ['data.product'],
      });

      const price = prices.data[0];

      if (!price) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Could not purchase subscription. Please contact support.',
        );
      }

      const returnTo =
        ctx.req.valid('form').returnTo || `${ctx.env.UI_ORIGIN}/settings`;

      const checkout = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: returnTo,
        cancel_url: returnTo,
        customer_email: user.email,
        customer: user.stripeCustomerId ?? undefined,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        subscription_data: {
          metadata: {
            userId,
          },
          trial_period_days: 14,
        },
      });

      if (!checkout.url) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Could not create checkout session',
        );
      }

      return ctx.redirect(checkout.url);
    },
  )
  .post('/cancel', userStoreMiddleware, async (ctx) => {
    const session = await sessions.getSession(ctx);
    if (!session) {
      throw new LongGameError(
        LongGameError.Code.Unauthorized,
        'Unauthorized',
        'No session found',
      );
    }

    assertPrefixedId(session.userId, 'u');

    const user = await ctx.env.ADMIN_STORE.getUser(session.userId);
    if (!user) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Invalid user. Please contact support.',
      );
    }

    const customerId = user.stripeCustomerId;
    if (!customerId) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'No stripe customer ID found for this user. Are you subscribed to a paid product?',
      );
    }

    const stripe = getStripe(ctx.env);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    await stripe.subscriptions.cancel(subscriptions.data[0].id, {
      // TODO: collect feedback.
    });

    return ctx.json({ success: true });
  });
