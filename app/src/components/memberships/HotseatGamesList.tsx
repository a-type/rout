import { useGame } from '@/hooks/useGame';
import { Box, Button, Card, Chip, DropdownMenu, H2, Icon } from '@a-type/ui';
import {
  HotseatBackend,
  HotseatGameDetails,
  useSuspenseQuery,
} from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { Link } from '@verdant-web/react-router';
import { GameIcon } from '../games/GameIcon';
import { GameSessionStatusChip } from './GameSessionStatusChip';

export interface HotseatGamesListProps {
  status?: 'pending' | 'active' | 'complete' | 'abandoned';
}

export const HotseatGamesList = withSuspense(function HotseatGamesList({
  status,
}: HotseatGamesListProps) {
  const { data } = useSuspenseQuery({
    queryFn: () => HotseatBackend.list(status),
    queryKey: ['hotseatGames', status],
  });

  if (!data.length) {
    return null;
  }
  return (
    <Box col gap>
      <H2 className="font-300 text-md uppercase my-0 mx-4">Hotseat Games</H2>
      <Card.Grid>
        {data.map((session) => (
          <HotseatSummaryCard key={session.gameSessionId} session={session} />
        ))}
      </Card.Grid>
    </Box>
  );
});

const HotseatSummaryCard = withSuspense(function HotseatSummaryCard({
  session,
}: {
  session: HotseatGameDetails;
}) {
  const game = useGame(session.gameId);
  return (
    <Card>
      {game && (
        <Card.Image>
          <GameIcon gameId={game.id} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-dark/50 to-transparent opacity-50" />
        </Card.Image>
      )}
      <Card.Main asChild>
        <Link to={`/hotseat/${session.gameSessionId}`}>
          <Card.Title>{game?.title ?? 'Choosing game...'}</Card.Title>
          <Card.Content unstyled className="flex flex-row gap-sm">
            <Chip color="accent">Hotseat</Chip>
            <GameSessionStatusChip status={session.status as any} />
          </Card.Content>
        </Link>
      </Card.Main>
      <Card.Footer>
        <Card.Menu>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button size="small" color="default">
                <Icon name="dots" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                color="destructive"
                onClick={() => HotseatBackend.delete(session.gameSessionId)}
              >
                Delete
                <DropdownMenu.ItemRightSlot>
                  <Icon name="trash" />
                </DropdownMenu.ItemRightSlot>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </Card.Menu>
      </Card.Footer>
    </Card>
  );
});
