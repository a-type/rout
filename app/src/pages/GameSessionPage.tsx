import { GameControls } from '@/components/games/GameControls';
import { GameJoinPreview } from '@/components/games/GameJoinPreview';
import { GameLayout } from '@/components/games/GameLayout';
import { GameSetup } from '@/components/games/GameSetup.js';
import { ScrollTicker } from '@/components/general/ScrollTicker';
import { sdkHooks } from '@/services/publicSdk';
import { Box, ErrorBoundary, Icon, Spinner } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSessionProvider, withGame } from '@long-game/game-client';
import { GameRenderer } from '@long-game/game-renderer';
import { TopographyProvider, usePlayerThemed } from '@long-game/game-ui';
import { useParams } from '@verdant-web/react-router';
import { Suspense } from 'react';

export function GameSessionPage() {
  const { sessionId } = useParams<{
    sessionId: PrefixedId<'gs'>;
  }>();

  // if player is only invited but not a member, don't join them to
  // the game session state yet
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });
  const pendingInviteForMe =
    pregame.myInvitation.status === 'pending' ? pregame.myInvitation : null;

  if (pendingInviteForMe) {
    return <GameJoinPreview myInvite={pendingInviteForMe} pregame={pregame} />;
  }

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
  const { className, style, palette } = usePlayerThemed(gameSuite.playerId);
  return (
    <TopographyProvider value={{ palette: palette ?? null }}>
      {gameSuite.gameStatus.status === 'complete' && (
        <Box surface="primary" className="rounded-none flex-shrink-0 py-xs">
          <ScrollTicker>
            <span>Game Over!</span>
            <Icon name="flag" />
          </ScrollTicker>
        </Box>
      )}
      <GameLayout className={className} style={style}>
        <GameLayout.Main>
          <Suspense
            fallback={
              <Box full layout="center center">
                <Spinner />
              </Box>
            }
          >
            {gameSuite.gameStatus.status === 'pending' ? (
              <GameSetup gameSessionId={sessionId} />
            ) : (
              <Box full className="game-ui">
                <GameRenderer />
              </Box>
            )}
          </Suspense>
        </GameLayout.Main>
        <GameControls pregame={gameSuite.gameStatus.status === 'pending'} />
      </GameLayout>
    </TopographyProvider>
  );
});

export default GameSessionPage;
