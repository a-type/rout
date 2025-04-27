import { assert } from '@a-type/utils';
import { assertPrefixedId, PrefixedId } from '@long-game/common';
import { Context } from 'hono';
import Stripe from 'stripe';
import { CtxVars } from '../config/ctx.js';
import {
  email,
  sendFreeTrialBeginningEmail,
  sendFreeTrialEndingEmail,
  sendSubscriptionCanceledEmail,
} from '../services/email.js';
import { stripeDateToDate } from '../services/stripe.js';

type EnvWithStripe = {
  Variables: CtxVars & { stripe: Stripe };
  Bindings: ApiBindings;
};

export async function handleTrialEnd(
  event: Stripe.CustomerSubscriptionTrialWillEndEvent,
  ctx: Context<EnvWithStripe>,
) {
  // notify user their trial is ending
  const user = await ctx.env.ADMIN_STORE.getUserByCustomerId(
    event.data.object.customer as string,
  );
  if (!user) {
    console.error(
      `No User found for customer ID ${event.data.object.customer}`,
    );
    return;
  }

  await sendFreeTrialEndingEmail(ctx, {
    to: user.email,
    userName: user.displayName,
    trialEndDate: stripeDateToDate(event.data.object.trial_end)!,
  });
}

export async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent,
  ctx: Context<EnvWithStripe>,
) {
  const subscription = event.data.object;

  const user = await ctx.env.ADMIN_STORE.getUserByCustomerId(
    subscription.customer as string,
  );
  if (!user) {
    console.error(`No User found for customer ID ${subscription.customer}`);
    return;
  }

  await onSubscriptionEnded({
    subscription,
    userId: user.id,
    ctx,
  });
}

export async function handleSubscriptionCreated(
  event: Stripe.CustomerSubscriptionCreatedEvent,
  ctx: Context<EnvWithStripe>,
) {
  const subscription = event.data.object;
  // attach subscription and customer to the organization based on metadata
  // we added during checkout

  const metadata = subscription.metadata as {
    userId: PrefixedId<'u'>;
  };
  const userId = metadata.userId;
  assertPrefixedId(userId, 'u');
  const user = await ctx.env.ADMIN_STORE.getUser(userId);

  if (!user) {
    console.error(
      `No user found for subscription ${
        subscription.id
      } based on metadata ${JSON.stringify(metadata)}`,
    );
    return;
  }

  // update the user with the customer ID
  assert(typeof subscription.customer === 'string', 'customer is not a string');
  await ctx.env.ADMIN_STORE.assignUserCustomerId(
    user.id,
    subscription.customer as string,
  );

  if (subscription.trial_end && subscription.status === 'trialing') {
    await sendFreeTrialBeginningEmail(ctx, {
      to: user.email,
      userName: user.displayName,
      trialEndDate: stripeDateToDate(subscription.trial_end)!,
    });
  }

  email
    .sendCustomEmail(
      {
        to: 'hi@rout.games',
        subject: 'Subscription Created',
        text: `A new subscription was created for ${user.email}: https://dashboard.stripe.com/subscriptions/${subscription.id}`,
        html: `<p>A new subscription was created for ${user.email}: <a href="https://dashboard.stripe.com/subscriptions/${subscription.id}">Link</a></p>`,
      },
      ctx as any,
    )
    .catch((error) => {
      console.error('Failed to send subscription creation email', error);
    });
}

export async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent,
  ctx: Context<EnvWithStripe>,
) {
  const subscription = event.data.object;

  const canceledAt = subscription.canceled_at
    ? stripeDateToDate(subscription.canceled_at)
    : null;

  const user = await ctx.env.ADMIN_STORE.getUserByCustomerId(
    subscription.customer as string,
  );

  if (!user) {
    console.error(`No user found for customer ID ${subscription.customer}`);
    return;
  }

  if (!!canceledAt) {
    await onSubscriptionEnded({
      subscription,
      userId: user.id,
      ctx,
    });
  }
}

async function onSubscriptionEnded({
  subscription,
  userId,
  ctx,
}: {
  subscription: Stripe.Subscription;
  userId: PrefixedId<'u'>;
  ctx: Context<EnvWithStripe>;
}) {
  const endsAt = stripeDateToDate(subscription.cancel_at);
  // notify plan admins their subscription was cancelled
  await sendSubscriptionCanceledEmail(ctx, {
    to: userId,
    userName: 'Alef User',
    endsAt: endsAt!,
  });
  email
    .sendCustomEmail(
      {
        to: 'hi@rout.games',
        subject: 'User Subscription Cancelled',
        text: `A subscription was cancelled: https://dashboard.stripe.com/subscriptions/${subscription.id}`,
        html: `<p>A subscription was cancelled: <a href="https://dashboard.stripe.com/subscriptions/${subscription.id}">Link</a></p>`,
      },
      ctx as any,
    )
    .catch((error) => {
      console.error('Failed to send subscription cancelled email', error);
    });
}

export async function handleEntitlementsUpdated(
  ev: Stripe.EntitlementsActiveEntitlementSummaryUpdatedEvent,
  ctx: Context<EnvWithStripe>,
) {
  // Entitlements tell us what features the associated org has access to based on subscription status.
  const customerId = ev.data.object.customer;
  const user = await ctx.env.ADMIN_STORE.getUserByCustomerId(customerId);
  if (!user) {
    console.error(`No User found for customer ID ${customerId}`);
    return;
  }
  // update the user's entitlements in our db
  const entitlementMap = getEntitlementsAsMap(ev);
  await ctx.env.ADMIN_STORE.updateUserEntitlements(user.id, entitlementMap);
}

function getEntitlementsAsMap(
  entitlements: Stripe.EntitlementsActiveEntitlementSummaryUpdatedEvent,
) {
  const map = {} as Record<string, boolean>;
  for (const entitlement of entitlements.data.object.entitlements.data) {
    if (!entitlement.feature) {
      continue;
    }
    map[entitlement.lookup_key] = true;
  }
  return map;
}

export const ENTITLEMENT_NAMES = {
  EXTRA_GAME_SESSIONS: 'extra-game-sessions',
};
