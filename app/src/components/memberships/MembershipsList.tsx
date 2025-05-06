import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Card, cardGridColumns } from '@a-type/ui';
import { CreateGame } from '../games/CreateGame';
import { GameSummaryCard } from './GameSummaryCard';

export function MembershipsList({
  statusFilter,
  invitationStatus,
}: {
  statusFilter?: ('active' | 'complete' | 'pending')[];
  invitationStatus?: 'pending' | 'accepted' | 'declined';
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
          <Box gap className="text-gray-dark" items="center">
            Nothing here.
            {(!statusFilter || statusFilter.includes('active')) && (
              <CreateGame color="unstyled" className="italic">
                Start a new game?
              </CreateGame>
            )}
          </Box>
        </Box>
      )}
      <Card.Grid columns={cardGridColumns.small}>
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
}
