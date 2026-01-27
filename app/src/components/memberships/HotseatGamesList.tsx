import { useGame } from '@/hooks/useGame';
import { Box, Button, Card, Chip, DropdownMenu, Icon } from '@a-type/ui';
import {
  HotseatBackend,
  HotseatGameDetails,
  queryClient,
  useSuspenseQuery,
} from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { Link } from '@verdant-web/react-router';
import { CreateHotseat } from '../games/CreateHotseat';
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
    return (
      <Box col gap layout="center center" className="text-gray-dark">
        <div>No hotseat games</div>
        <div>Play unlimited games by passing around this device</div>
        <CreateHotseat emphasis="ghost" size="small">
          Play Hotseat <Icon name="arrowRight" />
        </CreateHotseat>
      </Box>
    );
  }

  return (
    <Box col gap>
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
      <Card.Main render={<Link to={`/hotseat/${session.gameSessionId}`} />}>
        <Card.Title>{game?.title ?? 'Choosing game...'}</Card.Title>
        <Card.Content unstyled className="flex flex-row gap-sm">
          <Chip color="accent">Hotseat</Chip>
          <GameSessionStatusChip status={session.status as any} />
        </Card.Content>
      </Card.Main>
      <Card.Footer>
        <Card.Menu>
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={<Button size="small" emphasis="default" />}
            >
              <Icon name="dots" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                color="attention"
                onClick={async () => {
                  await HotseatBackend.delete(session.gameSessionId);
                  queryClient.invalidateQueries({
                    queryKey: ['hotseatGames'],
                  });
                }}
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
