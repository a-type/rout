import { assertPrefixedId, LongGameError } from '@long-game/common';
import { Hono } from 'hono';
import Stripe from 'stripe';
import { sessions } from '../auth/session.js';
import { CtxVars, Env } from '../config/ctx.js';
import { handleCustomerCreated } from '../management/customers.js';
import { handleCheckoutSessionCompleted } from '../management/oneOffPurchases.js';
import {
  handleEntitlementsUpdated,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  handleTrialEnd,
} from '../management/subscription.js';
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
        case 'customer.created':
          await handleCustomerCreated(event, ctx);
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
