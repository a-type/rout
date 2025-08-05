import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Card, Icon } from '@a-type/ui';
import { withSuspense } from '@long-game/game-ui';
import { ReactNode } from 'react';
import { CreateGame } from '../games/CreateGame.js';
import { GameSummaryCard } from './GameSummaryCard.js';

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
            {(!statusFilter || statusFilter.includes('active')) && (
              <CreateGame size="small" color="ghost">
                Start Playing <Icon name="arrowRight" />
              </CreateGame>
            )}
          </Box>
        </Box>
      )}
      <Card.Grid>
        {sessions?.map((session) => (
          <GameSummaryCard key={session.id} session={session} />
        ))}
      </Card.Grid>
      {hasNextPage && (
        <Box full="width" d="row" layout="center center">
          <Button color="ghost" onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
});
