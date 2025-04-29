import { sdkHooks } from '@/services/publicSdk';
import { Box, Button } from '@a-type/ui';
import { useNavigate } from '@verdant-web/react-router';
import { GameCard } from './GameCard';

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
        >
          Get Free Games
        </Button>
      </Box>
    );
  }

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-md">
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
    </Box>
  );
}
