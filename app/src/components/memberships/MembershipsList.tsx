import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Card, toast } from '@a-type/ui';
import { useEffect } from 'react';
import { CreateGame } from '../games/CreateGame';
import { GameSummaryCard } from './GameSummaryCard';

export function MembershipsList({
  statusFilter,
  invitationStatus,
}: {
  statusFilter?: ('active' | 'completed' | 'pending')[];
  invitationStatus?: 'pending' | 'accepted' | 'declined';
}) {
  const {
    data: { results: sessions, errors },
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = sdkHooks.useGetGameSessions({ status: statusFilter, invitationStatus });

  useEffect(() => {
    if (errors?.length) {
      errors.forEach(console.error);
      toast.error(
        'An error occurred while loading your games. Please try again later.',
        {
          id: 'games-list-error',
        },
      );
    }
  }, [errors]);

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
}
