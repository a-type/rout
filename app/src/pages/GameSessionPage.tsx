import { GameRecap } from '@/components/games/GameRecap.js';
import { GameSession } from '@/components/games/GameSession.js';
import { GameSetup } from '@/components/games/GameSetup.js';
import { gameSessionApiClient } from '@/services/gameSessions';
import { PageContent, PageRoot } from '@a-type/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from '@verdant-web/react-router';

export function GameSessionPage() {
  const { sessionId } = useParams();

  const { data: status } = useSuspenseQuery({
    queryKey: ['gameSession', sessionId, 'status'],
    queryFn: async ({ queryKey: [_, sessionId] }) => {
      const response = await gameSessionApiClient[':id'].status.$get({
        param: { id: sessionId },
      });
      const body = await response.json();
      return body;
    },
  });

  if (status === 'pending') {
    return (
      <PageRoot>
        <PageContent>
          <GameSetup gameSessionId={sessionId} />
        </PageContent>
      </PageRoot>
    );
  } else if (status === 'completed') {
    return (
      <PageRoot>
        <PageContent>
          <GameRecap gameSessionId={sessionId} />
        </PageContent>
      </PageRoot>
    );
  }
  return <GameSession gameSessionId={sessionId} />;
}

export default GameSessionPage;
