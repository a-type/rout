import { Box, Icon } from '@a-type/ui';
import {
  HotseatBackend,
  HotseatGameDetails,
  useSuspenseQuery,
} from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { GameSummaryCard } from '../games/sessions/GameSummaryCard';
import { HotseatGameSessionMenu } from '../games/sessions/HotseatGameSessionMenu';
import { StartHotseat } from '../games/StartHotseat';
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
        <StartHotseat emphasis="ghost" size="small">
          Play Hotseat <Icon name="arrowRight" />
        </StartHotseat>
      </Box>
    );
  }

  return (
    <Box col gap>
      <GameSummaryCard.Grid>
        {data.map((session) => (
          <HotseatSummaryCard key={session.gameSessionId} session={session} />
        ))}
      </GameSummaryCard.Grid>
    </Box>
  );
});

const HotseatSummaryCard = function HotseatSummaryCard({
  session,
}: {
  session: HotseatGameDetails;
}) {
  return (
    <GameSummaryCard
      session={{
        id: session.gameSessionId,
        canDelete: true,
        ...session,
      }}
      hotseat
    >
      <GameSummaryCard.Trigger>
        <GameSummaryCard.Icon />
        <GameSummaryCard.Details>
          <GameSummaryCard.Title />
          <Box gap items="center">
            <GameSessionStatusChip status={session.status as any} />
          </Box>
        </GameSummaryCard.Details>
      </GameSummaryCard.Trigger>
      <GameSummaryCard.Menu>
        <HotseatGameSessionMenu gameSessionId={session.gameSessionId} />
      </GameSummaryCard.Menu>
    </GameSummaryCard>
  );
};
