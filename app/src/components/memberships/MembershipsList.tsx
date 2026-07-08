import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, ErrorBoundary } from '@a-type/ui';
import { GameSession } from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { ReactNode } from 'react';
import { GameSummaryCard } from '../games/sessions/GameSummaryCard.js';
import { LiveGameSummaryCard } from '../games/sessions/LiveGameSummaryCard.js';

export const MembershipsList = withSuspense(function MembershipsList({
  statusFilter,
  invitationStatus,
  emptyState,
  customFilter,
}: {
  statusFilter?: ('active' | 'complete' | 'pending')[];
  invitationStatus?: 'pending' | 'accepted' | 'declined';
  emptyState?: ReactNode;
  customFilter?: (session: GameSession) => boolean;
}) {
  const {
    data: { results: sessions },
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = sdkHooks.useGetGameSessions({ status: statusFilter, invitationStatus });

  const filtered = customFilter ? sessions.filter(customFilter) : sessions;

  if (!sessions.length && emptyState === false) {
    return null;
  }

  return (
    <Box col gap full="width">
      {!sessions.length && (
        <Box full="width" layout="center center" p style={{ minHeight: 32 }}>
          <Box col gap dim layout="center center">
            {emptyState || "You're not a member of any online games."}
          </Box>
        </Box>
      )}
      <GameSummaryCard.Grid>
        {filtered?.map((session) => (
          <ErrorBoundary
            key={session.id}
            fallback={<GameSummaryCard.Skeleton />}
          >
            <LiveGameSummaryCard session={session} />
          </ErrorBoundary>
        ))}
      </GameSummaryCard.Grid>
      {hasNextPage && (
        <Box full="width" layout="center center">
          <Button emphasis="ghost" onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
});
