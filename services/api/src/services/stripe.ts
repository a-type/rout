import Stripe from 'stripe';

let stripe: Stripe | undefined = undefined;
export const getStripe = (env: ApiBindings) => {
  if (stripe) return stripe;
  stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });
  return stripe!;
};

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
