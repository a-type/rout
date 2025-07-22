import { Button, Card, Dialog, Icon, Marquee, clsx } from '@a-type/ui';
import { GameProduct } from '@long-game/game-client';
import { useSearchParams } from '@verdant-web/react-router';
import { GameIcon } from '../games/GameIcon.js';
import { BuyGameProduct } from './BuyGameProduct.js';

export interface GameProductCardProps {
  returnToAfterPurchase?: string;
  product: GameProduct;
}

export function GameProductCard({
  product,
  returnToAfterPurchase,
}: GameProductCardProps) {
  const [search, setSearch] = useSearchParams();
  const isOpen = search.get('productId') === product.id;
  const open = () => {
    setSearch((v) => {
      v.set('productId', product.id);
      return v;
    });
  };
  const close = () => {
    setSearch((v) => {
      v.delete('productId');
      return v;
    });
  };
  return (
    <Card>
      <Card.Image>
        <Marquee>
          {product.gameProductItems.map((item) => (
            <GameIcon gameId={item.gameId} key={item.gameId} />
          ))}
        </Marquee>
      </Card.Image>
      <Dialog
        open={isOpen}
        onOpenChange={(o) => {
          if (o) {
            open();
          } else {
            close();
          }
        }}
      >
        <Dialog.Trigger asChild>
          <Card.Main className="aspect-1">
            <Card.Title>{product.name}</Card.Title>
            <Card.Content
              className={clsx(
                'text-md font-bold',
                product.isOwned && 'bg-accent-wash color-accent-ink',
              )}
            >
              {product.isOwned
                ? 'Owned'
                : product.priceCents === 0
                  ? 'Free'
                  : `$${product.priceCents / 100}`}
            </Card.Content>
            <Card.Content>{product.gameProductItems.length} games</Card.Content>
            {!product.publishedAt && (
              <Card.Content className="text-xs flex-row">
                <Icon name="eyeClosed" />
                Admins only
              </Card.Content>
            )}

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
            <BuyGameProduct
              color="accent"
              productId={product.id}
              disabled={product.isOwned}
              returnTo={returnToAfterPurchase}
            >
              {product.isOwned
                ? 'Owned'
                : product.priceCents === 0
                  ? 'Get'
                  : 'Buy'}
            </BuyGameProduct>
          </Dialog.Actions>
        </Dialog.Content>
      </Dialog>
    </Card>
  );
}
