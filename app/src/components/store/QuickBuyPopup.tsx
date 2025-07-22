import { useGame } from '@/hooks/useGame';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, ButtonProps, Card, clsx, Dialog, Icon } from '@a-type/ui';
import { GameProduct } from '@long-game/game-client';
import { Link, useSearchParams } from '@verdant-web/react-router';
import { BuyGameProduct } from './BuyGameProduct.js';

export interface QuickBuyPopupProps {}

export function QuickBuyPopup({}: QuickBuyPopupProps) {
  const [search, setSearch] = useSearchParams();
  const gameId = search.get('quickBuy');
  const game = useGame(gameId || '');

  const close = () => {
    setSearch((v) => {
      v.delete('quickBuy');
      return v;
    });
  };

  return (
    <Dialog
      open={!!gameId}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      {gameId && (
        <Dialog.Content width="md">
          <Dialog.Title>Buy game</Dialog.Title>
          {/* TODO: game info */}
          <Dialog.Description>
            {game?.title} is available in these bundles:
          </Dialog.Description>
          <QuickBuyProductList gameId={gameId} />
          <Dialog.Actions>
            <Dialog.Close />
          </Dialog.Actions>
        </Dialog.Content>
      )}
    </Dialog>
  );
}

export function OpenQuickBuyButton({
  gameId,
  ...rest
}: { gameId: string } & ButtonProps) {
  const [_, setSearch] = useSearchParams();
  const open = () => {
    setSearch((v) => {
      v.set('quickBuy', gameId);
      return v;
    });
  };

  return (
    <Button {...rest} onClick={open}>
      <Icon name="cart" />
      Buy
    </Button>
  );
}

function QuickBuyProductList({ gameId }: { gameId: string }) {
  const { data: products } = sdkHooks.useGetGameProducts({
    includingGame: gameId,
  });

  if (!products.length) {
    return (
      <Box full="width" p="lg">
        Oh dear! Looks like this game isn't available for purchase right now.
      </Box>
    );
  }

  return (
    <Card.Grid>
      {products.map((product) => (
        <QuickBuyProductCard key={product.id} product={product} />
      ))}
    </Card.Grid>
  );
}

function QuickBuyProductCard({ product }: { product: GameProduct }) {
  return (
    <Card>
      <Card.Main>
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
      </Card.Main>
      <Card.Actions className="flex-col items-start w-full">
        <Button asChild size="small">
          <Link to={`/library?productId=${product.id}`}>
            View in store
            <Icon name="arrowRight" />
          </Link>
        </Button>
        <BuyGameProduct
          productId={product.id}
          returnTo={window.location.href}
          color="accent"
          size="small"
        >
          <Icon name="cart" />
          Buy now
        </BuyGameProduct>
      </Card.Actions>
    </Card>
  );
}
