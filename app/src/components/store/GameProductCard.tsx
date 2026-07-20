import { Button, Card, Dialog, Icon, Marquee } from '@a-type/ui';
import { GameProduct } from '@long-game/game-client';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { GameIcon } from '../games/GameIcon.js';
import { BuyGameProduct } from './BuyGameProduct.js';
import cls from './GameProductCard.module.css';
import { Price } from './Price.js';

export interface GameProductCardProps {
  returnToAfterPurchase?: string;
  product: GameProduct;
}

export function GameProductCard({
  product,
  returnToAfterPurchase,
}: GameProductCardProps) {
  const { productId } = useSearch({
    strict: false,
  });
  const navigate = useNavigate();
  const isOpen = !!productId;
  const open = () => {
    navigate({
      from: '/',
      search: (prev) => ({
        ...prev,
        productId: product.id,
      }),
    });
  };
  const close = () => {
    navigate({
      from: '/',
      search: ({ productId, ...v }) => v,
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
        <Dialog.Trigger render={<Card.Main style={{ aspectRatio: 1 }} />}>
          <Card.Title>{product.name}</Card.Title>
          <Card.Content unstyled>
            <Price product={product} />
          </Card.Content>
          <Card.Content>{product.gameProductItems.length} games</Card.Content>
          {!product.publishedAt && (
            <Card.Content className={cls.admins}>
              <Icon name="eyeClosed" />
              Admins only
            </Card.Content>
          )}

          <Button tabIndex={-1} className={cls.details} render={<div />}>
            Details <Icon name="new_window" />
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>{product.name}</Dialog.Title>
          <Dialog.Description>{product.description}</Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close style={{ marginRight: 'auto' }} />
            <BuyGameProduct
              color="accent"
              emphasis="primary"
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
