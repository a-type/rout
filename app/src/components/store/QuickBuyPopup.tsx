import { useGame } from '@/hooks/useGame';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, ButtonProps, Card, Dialog, Icon } from '@a-type/ui';
import { GameProduct } from '@long-game/game-client';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { BuyGameProduct } from './BuyGameProduct.js';
import { Price } from './Price.js';

export interface QuickBuyPopupProps {}

export function QuickBuyPopup({}: QuickBuyPopupProps) {
  const { quickBuy: gameId } = useSearch({
    strict: false,
  });
  const navigate = useNavigate();
  const game = useGame(gameId || '');

  const close = () => {
    navigate({
      from: '/',
      search: ({ quickBuy, ...v }) => v,
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

export function useOpenQuickBuy() {
  const navigate = useNavigate();
  const open = (gameId: string) => {
    navigate({
      from: '/',
      search: (prev) => ({
        ...prev,
        quickBuy: gameId,
      }),
    });
  };
  return open;
}

export function OpenQuickBuyButton({
  gameId,
  ...rest
}: { gameId: string } & ButtonProps) {
  const open = useOpenQuickBuy();
  const onClick = () => {
    open(gameId);
  };

  return (
    <Button {...rest} onClick={onClick}>
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
        <Card.Content unstyled>
          <Price product={product} />
        </Card.Content>
        <Card.Content>{product.gameProductItems.length} games</Card.Content>
      </Card.Main>
      <Card.Actions>
        <Button
          size="small"
          render={
            <Link
              to="/library"
              search={{
                productId: product.id,
              }}
            />
          }
        >
          View in store
          <Icon name="arrowRight" />
        </Button>
        <BuyGameProduct
          productId={product.id}
          returnTo={window.location.href}
          color="accent"
          emphasis="primary"
          size="small"
        >
          <Icon name="cart" />
          Buy now
        </BuyGameProduct>
      </Card.Actions>
    </Card>
  );
}
