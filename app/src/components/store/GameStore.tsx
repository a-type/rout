import { sdkHooks } from '@/services/publicSdk';
import { Card, cardGridColumns } from '@a-type/ui';
import { GameProductCard } from './GameProductCard.js';

export interface GameStoreProps {
  className?: string;
}

export function GameStore({ className }: GameStoreProps) {
  const { data: products } = sdkHooks.useGetGameProducts({});

  return (
    <Card.Grid columns={cardGridColumns.small} className={className}>
      {products.map((product) => (
        <GameProductCard key={product.id} product={product} />
      ))}
    </Card.Grid>
  );
}
