import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, ErrorBoundary } from '@a-type/ui';
import { withSuspense } from '@long-game/game-ui';
import { ReactNode } from 'react';
import { GameSummaryCard } from '../games/sessions/GameSummaryCard.js';
import { LiveGameSummaryCard } from '../games/sessions/LiveGameSummaryCard.js';

export const MembershipsList = withSuspense(function MembershipsList({
  statusFilter,
  invitationStatus,
  emptyState,
}: {
  statusFilter?: ('active' | 'complete' | 'pending')[];
  invitationStatus?: 'pending' | 'accepted' | 'declined';
  emptyState?: ReactNode;
}) {
  const {
    data: { results: sessions },
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = sdkHooks.useGetGameSessions({ status: statusFilter, invitationStatus });

  return (
    <Box d="col" gap full="width">
      {!sessions.length && (
        <Box full="width" layout="center center" p className="min-h-8">
          <Box col gap className="color-gray-dark" layout="center center">
            {emptyState || "You're not a member of any online games."}
          </Box>
        </Box>
      )}
      <GameSummaryCard.Grid>
        {sessions?.map((session) => (
          <ErrorBoundary
            key={session.id}
            fallback={<GameSummaryCard.Skeleton />}
          >
            <LiveGameSummaryCard session={session} />
          </ErrorBoundary>
        ))}
      </GameSummaryCard.Grid>
      {hasNextPage && (
        <Box full="width" d="row" layout="center center">
          <Button emphasis="ghost" onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
});
