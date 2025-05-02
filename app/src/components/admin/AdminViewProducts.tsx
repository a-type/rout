import { sdkHooks } from '@/services/publicSdk';
import { Card } from '@a-type/ui';
import { GameProduct } from '@long-game/game-client';
import { Link } from '@verdant-web/react-router';

export interface AdminViewProductsProps {}

export function AdminViewProducts({}: AdminViewProductsProps) {
  const { data: products } = sdkHooks.useGetGameProducts({});

  return (
    <Card.Grid>
      {products.map((product) => (
        <AdminProductCard key={product.id} product={product} />
      ))}
    </Card.Grid>
  );
}

function AdminProductCard({ product }: { product: GameProduct }) {
  return (
    <Card>
      <Card.Image>
        {product.gameProductItems.map((item) => (
          <img
            src={`/game-data/${item.gameId}/icon.png`}
            alt={item.gameId}
            key={item.gameId}
          />
        ))}
      </Card.Image>
      <Card.Main asChild>
        <Link to={`?productId=${product.id}`}>
          <Card.Title>{product.name}</Card.Title>
          <Card.Content>${product.priceCents / 100}</Card.Content>
          <Card.Content>{product.gameProductItems.length} games</Card.Content>
        </Link>
      </Card.Main>
    </Card>
  );
}
