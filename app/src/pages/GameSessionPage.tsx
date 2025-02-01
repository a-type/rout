import { GameRecap } from '@/components/games/GameRecap.js';
import { GameSession } from '@/components/games/GameSession.js';
import { GameSetup } from '@/components/games/GameSetup.js';
import { sdkHooks } from '@/services/publicSdk';
import { H1, PageContent, PageRoot } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { useParams } from '@verdant-web/react-router';

export function GameSessionPage() {
  const { sessionId } = useParams<{
    sessionId: PrefixedId<'gs'>;
  }>();

  const { data } = sdkHooks.useGetGameSessionStatus({
    id: sessionId,
  });

  if (data.status === 'pending') {
    return (
      <PageRoot>
        <PageContent>
          <H1>Start a game</H1>
          <GameSetup gameSessionId={sessionId} />
        </PageContent>
      </PageRoot>
    );
  } else if (data.status === 'completed') {
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
