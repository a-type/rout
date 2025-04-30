import { isPrefixedId, LongGameError } from '@long-game/common';
import { Context } from 'hono';
import Stripe from 'stripe';
import { CtxVars } from '../config/ctx';

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
  const customerId = session.customer as string;
  const user = await ctx.env.ADMIN_STORE.getUserByCustomerId(customerId);
  if (!user) {
    throw new LongGameError(
      LongGameError.Code.NotFound,
      `No user found for customer ID ${customerId}`,
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
    .filter((product) => {
      return product.metadata.type === 'game';
    });

  if (gameProducts.length === 0) {
    console.debug('No games purchased in this checkout session');
    return;
  }

  for (const product of gameProducts) {
    const gameProductId = product.metadata.gameProductId;
    if (!gameProductId) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Game product ${product.id} does not have a gameProductId`,
      );
    }
    if (!isPrefixedId(gameProductId, 'gp')) {
      throw new LongGameError(
        LongGameError.Code.BadRequest,
        `Game product ${product.id} has an invalid gameProductId: ${gameProductId}`,
      );
    }
    await ctx.env.ADMIN_STORE.purchaseGameProduct(user.id, gameProductId);
    console.log(
      `Applied game purchase for user ${user.id} for game ${gameProductId}`,
    );
  }
}
