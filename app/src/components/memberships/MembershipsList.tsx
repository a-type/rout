import { sdkHooks } from '@/services/publicSdk';
import { Card } from '@a-type/ui';
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
      <h2 className="font-300 text-md uppercase my-0 mx-4">Games</h2>
      <Card.Grid>
        {sessions?.map((session) => (
          <GameSummaryCard key={session.id} session={session} />
        ))}
      </Card.Grid>
    </div>
  );
}
