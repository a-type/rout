import { API_ORIGIN } from '@/config';
import { Button, ButtonProps } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';

export interface BuyGameProductProps extends ButtonProps {
  productId: PrefixedId<'gp'>;
  returnTo?: string;
}

export function BuyGameProduct({
  productId,
  className,
  returnTo,
  ...rest
}: BuyGameProductProps) {
  return (
    <form
      className={className}
      action={`${API_ORIGIN}/games/products/${productId}/purchase`}
      method="POST"
    >
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Button type="submit" {...rest} />
    </form>
  );
}
