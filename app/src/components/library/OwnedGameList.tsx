import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Card, cardGridColumns } from '@a-type/ui';
import { useNavigate } from '@verdant-web/react-router';
import { GameCard } from './GameCard.js';

export interface OwnedGameListProps {
  className?: string;
}

export function OwnedGameList({ className }: OwnedGameListProps) {
  const { data: ownedGameIds } = sdkHooks.useGetOwnedGames();
  const applyFreeGames = sdkHooks.useApplyFreeGames();
  const navigate = useNavigate();

  if (!ownedGameIds.length) {
    return (
      <Box d="col" gap full="width" p="xl" layout="center center">
        <span>
          Wait just a minute! You should have games here! We can fix that...
        </span>
        <Button
          onClick={() => applyFreeGames.mutate(undefined)}
          loading={applyFreeGames.isPending}
          color="accent"
          emphasis="primary"
        >
          Get Free Games
        </Button>
      </Box>
    );
  }

  return (
    <Card.Grid columns={cardGridColumns.small}>
      {ownedGameIds.map((gameId) => (
        <GameCard
          key={gameId}
          gameId={gameId}
          owned
          className={className}
          onClick={() => {
            navigate(`/library/${gameId}`);
          }}
        />
      ))}
    </Card.Grid>
  );
}
