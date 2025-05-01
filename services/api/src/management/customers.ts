import { isPrefixedId } from '@long-game/common';
import { Context } from 'hono';
import Stripe from 'stripe';
import { CtxVars } from '../config/ctx';

type EnvWithStripe = {
  Variables: CtxVars & { stripe: Stripe };
  Bindings: ApiBindings;
};

export async function handleCustomerCreated(
  event: Stripe.CustomerCreatedEvent,
  ctx: Context<EnvWithStripe>,
) {
  const customerId = event.data.object.id;
  const userId = event.data.object.metadata.userId;

  if (!userId) {
    console.error('No userId found in customer metadata');
    return;
  }

  if (!isPrefixedId(userId, 'u')) {
    console.error('Invalid userId format', userId);
    return;
  }

  try {
    await ctx.env.ADMIN_STORE.assignUserCustomerId(userId, customerId);
  } catch (err) {
    console.error('Error creating customer in database', err);
  }
}
