import Stripe from 'stripe';

export const getStripe = (env: ApiBindings) =>
  new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil',
  });

export function stripeDateToDate(
  stripeDate: number | undefined | null,
): Date | undefined {
  if (stripeDate === undefined || stripeDate === null) {
    return undefined;
  }
  return new Date(stripeDate * 1000);
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  // NOTE: assumes we only have 1 item per subscription
  return subscription.items.data?.[0]?.current_period_end ?? null;
}
