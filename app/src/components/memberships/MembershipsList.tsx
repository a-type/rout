import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Card, toast } from '@a-type/ui';
import { useEffect } from 'react';
import { GameSummaryCard } from './GameSummaryCard';

export function MembershipsList({
  statusFilter,
}: {
  statusFilter?: ('active' | 'completed' | 'pending')[];
}) {
  const {
    data: { results: sessions, errors },
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = sdkHooks.useGetGameSessions({ status: statusFilter });

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
