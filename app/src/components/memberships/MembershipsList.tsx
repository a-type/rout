import { sdkHooks } from '@/services/publicSdk';
import { Card, H1 } from '@a-type/ui';
import { useEffect } from 'react';
import { GameSummaryCard } from './GameSummaryCard';

export function MembershipsList() {
  const {
    data: { sessions, errors },
  } = sdkHooks.useGetGameSessions();

  useEffect(() => {
    if (errors?.length) {
      errors.forEach(console.error);
    }
  }, [errors]);

  return (
    <div className="flex flex-col gap-3">
      <H1>Games</H1>
      <Card.Grid>
        {sessions?.map((session) => (
          <GameSummaryCard key={session.id} session={session} />
        ))}
      </Card.Grid>
    </div>
  );
}
