import { GameControls } from '@/components/games/GameControls';
import { GameSetup } from '@/components/games/GameSetup.js';
import { Box, ErrorBoundary, PageContent, PageRoot, Spinner } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSessionProvider, withGame } from '@long-game/game-client';
import { GameRenderer } from '@long-game/game-renderer';
import { GameLayout } from '@long-game/game-ui';
import { useParams } from '@verdant-web/react-router';
import { Suspense } from 'react';

export function GameSessionPage() {
  const { sessionId } = useParams<{
    sessionId: PrefixedId<'gs'>;
  }>();

  return (
    <ErrorBoundary fallback={<div>Ooops, something went wrong 😥.</div>}>
      <GameSessionProvider gameSessionId={sessionId}>
        <GameSessionRenderer />
      </GameSessionProvider>
    </ErrorBoundary>
  );
}

const GameSessionRenderer = withGame(function GameSessionRenderer({
  gameSuite,
}) {
  const sessionId = gameSuite.gameSessionId;
  switch (gameSuite.gameStatus.status) {
    case 'pending':
      return (
        <PageRoot>
          <PageContent>
            <GameSetup gameSessionId={sessionId} />
          </PageContent>
        </PageRoot>
      );
    default:
      return (
        <GameLayout>
          <GameLayout.Main>
            <Suspense
              fallback={
                <Box full layout="center center">
                  <Spinner />
                </Box>
              }
            >
              <GameRenderer />
            </Suspense>
          </GameLayout.Main>
          <GameControls />
        </GameLayout>
      );
  }
});

export default GameSessionPage;
