import { PrefixedId } from '@long-game/common';
import Stripe from 'stripe';

export type StripeGameProductCheckoutMetadata = {
  type: 'gameProduct';
  gameProductId: PrefixedId<'gp'>;
};

export type StripeCheckoutMetadata = StripeGameProductCheckoutMetadata;

export function isStripeGameProductCheckoutMetadata(
  metadata: Stripe.Metadata,
): metadata is StripeGameProductCheckoutMetadata {
  return metadata?.type === 'gameProduct';
}

export function createStripeGameProductCheckoutMetadata(
  gameProductId: PrefixedId<'gp'>,
): StripeGameProductCheckoutMetadata {
  return {
    type: 'gameProduct',
    gameProductId,
  };
}
