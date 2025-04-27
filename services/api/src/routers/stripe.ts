import { zValidator } from '@hono/zod-validator';
import { assertPrefixedId, LongGameError } from '@long-game/common';
import { Hono } from 'hono';
import Stripe from 'stripe';
import { z } from 'zod';
import { sessions } from '../auth/session.js';
import { CtxVars, Env } from '../config/ctx.js';
import { handleCheckoutSessionCompleted } from '../management/oneOffPurchases.js';
import {
  handleEntitlementsUpdated,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  handleTrialEnd,
} from '../management/subscription.js';
import { loggedInMiddleware } from '../middleware/session.js';
import { getStripe } from '../services/stripe.js';

export const stripeRouter = new Hono<Env>()
  .use<{
    Bindings: ApiBindings;
    Variables: CtxVars & {
      stripe: Stripe;
    };
  }>(async (ctx, next) => {
    ctx.set('stripe', getStripe(ctx.env));
    return next();
  })
  .post('/webhook', async (ctx) => {
    const stripe = ctx.get('stripe');
    const signature = ctx.req.header('stripe-signature')!;
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        await ctx.req.text(),
        signature,
        ctx.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err);
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'Webhook signature verification failed',
        err,
      );
    }

    try {
      switch (event.type) {
        case 'customer.subscription.trial_will_end':
          await handleTrialEnd(event, ctx);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event, ctx);
          break;
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event, ctx);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event, ctx);
          break;
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event, ctx);
          break;
        case 'entitlements.active_entitlement_summary.updated':
          await handleEntitlementsUpdated(event, ctx);
          break;
      }

      return new Response('OK');
    } catch (err) {
      console.error('Error handling webhook event', err);
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Error handling webhook event',
        err,
      );
    }
  })
  .get('/products', async (ctx) => {
    const stripe = ctx.get('stripe');
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });
    return ctx.json(products.data || []);
  })
  .post('/cancel-subscription', loggedInMiddleware, async (ctx) => {
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

    const stripe = ctx.get('stripe');
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    await stripe.subscriptions.cancel(subscriptions.data[0].id, {
      // TODO: collect feedback.
    });

    return ctx.json({ success: true });
  })
  .post(
    '/checkout-session',
    loggedInMiddleware,
    zValidator(
      'form',
      z.object({
        priceKey: z.string(),
        returnTo: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const userId = ctx.get('session').userId;
      if (!userId) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'No user ID found in session',
        );
      }

      const body = ctx.req.valid('form');
      const priceKey = body.priceKey;

      assertPrefixedId(userId, 'u');

      const prices = await ctx.get('stripe').prices.list({
        lookup_keys: [priceKey],
        expand: ['data.product'],
      });

      const price = prices.data[0];

      if (!price) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Could not purchase subscription. Please contact support.',
        );
      }

      const userInfo = await ctx.env.ADMIN_STORE.getUser(userId);
      if (!userInfo) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Could not purchase membership. Please contact support.',
        );
      }

      const returnTo = body.returnTo || `${ctx.env.UI_ORIGIN}/settings`;
      const checkout = await ctx.get('stripe').checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: returnTo,
        cancel_url: returnTo,
        customer_email: userInfo.email,
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

      return new Response(null, {
        status: 302,
        headers: {
          Location: checkout.url,
        },
      });
    },
  )
  .post('/portal-session', async (ctx) => {
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

    if (!user.stripeCustomerId) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        'No stripe customer ID found for this user. Are you subscribed to a paid product?',
      );
    }

    const portal = await ctx.get('stripe').billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${ctx.env.UI_ORIGIN}/settings`,
    });

    if (!portal.url) {
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        'Could not create billing portal session',
      );
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: portal.url,
      },
    });
  });
