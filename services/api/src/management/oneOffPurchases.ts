import { isPrefixedId, LongGameError } from '@long-game/common';
import { Context } from 'hono';
import Stripe from 'stripe';
import { CtxVars } from '../config/ctx';
import { isStripeGameProductCheckoutMetadata } from './stripeMetadata';
import { getUserWithFallbacks } from './users';

type EnvWithStripe = {
  Variables: CtxVars & { stripe: Stripe };
  Bindings: ApiBindings;
};

export async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
  ctx: Context<EnvWithStripe>,
) {
  const session = event.data.object as Stripe.Checkout.Session;

  // get the user by customer id
  const userIdFromMetadata = session.metadata?.userId;
  const customerId = session.customer as string;
  const email = session.customer_email;
  const user = await getUserWithFallbacks(
    ctx.env,
    userIdFromMetadata,
    customerId,
    email,
  );

  if (!user) {
    throw new LongGameError(
      LongGameError.Code.NotFound,
      `No user found for customer ID ${customerId} or email ${email}`,
    );
  }

  // did the checkout include products tagged as games?
  const lineItems = await ctx
    .get('stripe')
    .checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });
  const gameProducts = lineItems.data
    .map((item) => item.price?.product as Stripe.Product | undefined)
    .filter((p) => !!p)
    .map((p) => p.metadata)
    .filter((metadata) => !!metadata)
    .filter((product) => {
      return isStripeGameProductCheckoutMetadata(product);
    });

  if (gameProducts.length === 0) {
    console.debug('No games purchased in this checkout session');
    return;
  }

  for (const product of gameProducts) {
    const gameProductId = product.gameProductId;
    if (!gameProductId) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Game product from checkout ${session.id} does not have a gameProductId`,
      );
    }
    if (!isPrefixedId(gameProductId, 'gp')) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Game product from checkout ${session.id} has an invalid gameProductId: ${gameProductId}`,
      );
    }
    await ctx.env.ADMIN_STORE.purchaseGameProduct(user.id, gameProductId);
    console.log(
      `Applied game purchase for user ${user.id} for game ${gameProductId}`,
    );
  }
}
