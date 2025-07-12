import { GameAbandonedNotice } from '@/components/games/GameAbandonedNotice';
import { GameControls } from '@/components/games/GameControls';
import { GameJoinPreview } from '@/components/games/GameJoinPreview';
import { GameLayout } from '@/components/games/GameLayout';
import { GameSetup } from '@/components/games/GameSetup.js';
import { ScrollTicker } from '@/components/general/ScrollTicker';
import { useDefaultBgColor } from '@/hooks/useThemedTitleBar';
import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  ErrorBoundary,
  getResolvedColorMode,
  Icon,
  Spinner,
  useColorMode,
  useTitleBarColor,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSessionProvider, withGame } from '@long-game/game-client';
import { ChatRenderer, GameRenderer } from '@long-game/game-renderer';
import {
  DelayedSubmitUndo,
  DndRoot,
  RendererProvider,
  SpatialChatDraggable,
  TopographyProvider,
  usePlayerThemed,
} from '@long-game/game-ui';
import { useParams } from '@verdant-web/react-router';
import { Suspense, useLayoutEffect } from 'react';

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
      <GameSessionProvider
        gameSessionId={sessionId}
        fallback={
          <Box full layout="center center">
            <Spinner />
          </Box>
        }
      >
        <GameSessionRenderer />
      </GameSessionProvider>
    </ErrorBoundary>
  );
}

const providerValue = {
  ChatRendererComponent: ChatRenderer,
};
const GameSessionRenderer = withGame(function GameSessionRenderer({
  gameSuite,
}) {
  const sessionId = gameSuite.gameSessionId;
  const { palette } = usePlayerThemedPage(gameSuite.playerId);

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
      {gameSuite.gameStatus.status === 'abandoned' && (
        <Box surface="attention" className="rounded-none flex-shrink-0 py-xs">
          <ScrollTicker>
            <span>Game Abandoned 😢</span>
          </ScrollTicker>
        </Box>
      )}
      <RendererProvider value={providerValue}>
        <DndRoot className="w-full h-full flex flex-col">
          <GameLayout>
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
                  <GameRenderer />
                )}
              </Suspense>
              {gameSuite.gameStatus.status !== 'pending' && (
                <ErrorBoundary>
                  <Suspense>
                    <SpatialChatDraggable className="fixed anchor-to-gameMain left-[calc(anchor(left)+0.5rem)] bottom-[calc(anchor(bottom)+1rem)] lg:bottom-[calc(anchor(bottom)+0.5rem)] z-menu" />
                  </Suspense>
                </ErrorBoundary>
              )}
            </GameLayout.Main>
            <GameControls pregame={gameSuite.gameStatus.status === 'pending'} />
            <DelayedSubmitUndo />
            {gameSuite.gameStatus.status === 'abandoned' && (
              <GameAbandonedNotice />
            )}
          </GameLayout>
        </DndRoot>
      </RendererProvider>
    </TopographyProvider>
  );
});

export default GameSessionPage;

function usePlayerThemedPage(playerId: PrefixedId<'u'>) {
  const { className, style, palette } = usePlayerThemed(playerId);
  const backupColor = useDefaultBgColor();
  useColorMode();

  const titleColor = !palette
    ? backupColor
    : getResolvedColorMode() === 'dark'
      ? palette.range[11]
      : palette.range[0];
  useTitleBarColor(titleColor);

  useLayoutEffect(() => {
    document.body.classList.add(className);
    for (const [key, value] of Object.entries(style)) {
      document.body.style.setProperty(key, value as string);
    }

    return () => {
      document.body.classList.remove(className);
      for (const key of Object.keys(style)) {
        document.body.style.removeProperty(key);
      }
    };
  }, [className, style]);

  return { className, style, palette };
}
