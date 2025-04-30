import { sdkHooks } from '@/services/publicSdk';
import {
  Button,
  Card,
  cardGridColumns,
  clsx,
  Dialog,
  Icon,
  Marquee,
} from '@a-type/ui';
import { GameProduct } from '@long-game/game-client';
import { GameIcon } from '../games/GameIcon';

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

function GameProductCard({ product }: { product: GameProduct }) {
  return (
    <Card>
      <Card.Image>
        <Marquee>
          {product.gameProductItems.map((item) => (
            <GameIcon gameId={item.gameId} key={item.gameId} />
          ))}
        </Marquee>
      </Card.Image>
      <Dialog>
        <Dialog.Trigger asChild>
          <Card.Main className="aspect-1">
            <Card.Title>{product.name}</Card.Title>
            <Card.Content
              className={clsx(
                'text-md font-bold',
                product.isOwned && 'bg-accent-wash color-accent-ink',
              )}
            >
              {product.isOwned ? 'Owned' : `$${product.priceCents / 100}`}
            </Card.Content>
            <Card.Content>{product.gameProductItems.length} games</Card.Content>
            <Button asChild className="absolute bottom-sm right-sm">
              <div>
                Details <Icon name="new_window" />
              </div>
            </Button>
          </Card.Main>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>{product.name}</Dialog.Title>
          <Dialog.Description>{product.description}</Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close className="mr-auto" />
            <Button color="accent" disabled={product.isOwned}>
              {product.isOwned
                ? 'Owned'
                : product.priceCents === 0
                ? 'Get'
                : 'Buy'}
            </Button>
          </Dialog.Actions>
        </Dialog.Content>
      </Dialog>
    </Card>
  );
}
