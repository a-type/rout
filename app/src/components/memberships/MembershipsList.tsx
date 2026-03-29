import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Card, ErrorBoundary } from '@a-type/ui';
import { withSuspense } from '@long-game/game-ui';
import { ReactNode } from 'react';
import { FallbackGameSummaryCard, GameSummaryCard } from './GameSummaryCard.js';

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
    refetch,
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
      <Card.Grid>
        {sessions?.map((session) => (
          <ErrorBoundary
            key={session.id}
            fallback={
              <FallbackGameSummaryCard
                sessionId={session.id}
                refetch={refetch}
              />
            }
          >
            <GameSummaryCard session={session} />
          </ErrorBoundary>
        ))}
      </Card.Grid>
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
