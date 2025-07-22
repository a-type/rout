import { useDefaultBgColor } from '@/hooks/useThemedTitleBar';
import { getFederatedGameComponent } from '@/services/games';
import { checkForUpdate, skipWaiting } from '@/swRegister.js';
import {
  Box,
  Button,
  ErrorBoundary,
  getResolvedColorMode,
  Icon,
  Spinner,
  useColorMode,
  useTitleBarColor,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { GameSessionProvider, withGame } from '@long-game/game-client';
import {
  DelayedSubmitUndo,
  DndRoot,
  RendererProvider,
  SpatialChatDraggable,
  TopographyProvider,
  usePlayerThemed,
} from '@long-game/game-ui';
import { Suspense, use, useLayoutEffect, useMemo } from 'react';
import { ScrollTicker } from '../general/ScrollTicker.js';
import { GameAbandonedNotice } from './GameAbandonedNotice.js';
import { GameControls } from './GameControls.js';
import { GameLayout } from './GameLayout.js';
import { GameSetup } from './GameSetup.js';

export interface GameSessionRendererProps {
  gameSessionId: PrefixedId<'gs'>;
  gameId: string;
  gameVersion: string;
}

export function GameSessionRenderer({
  gameSessionId,
  gameId,
  gameVersion,
}: GameSessionRendererProps) {
  const gameDefinition = use(
    getFederatedGameComponent(gameId, gameVersion, 'definition'),
  );

  return (
    <GameSessionProvider
      gameSessionId={gameSessionId}
      gameDefinition={gameDefinition}
      fallback={
        <Box full layout="center center">
          <Spinner />
        </Box>
      }
    >
      <GameSessionRendererInner />
    </GameSessionProvider>
  );
}

const GameSessionRendererInner = withGame(function GameSessionRendererInner({
  gameSuite,
}) {
  const sessionId = gameSuite.gameSessionId;
  const gameId = gameSuite.gameId;
  const version = gameSuite.gameDefinition.version;
  const { palette } = usePlayerThemedPage(gameSuite.playerId);

  const renderProviderValue = useMemo(() => {
    return {
      ChatRendererComponent: getFederatedGameComponent(gameId, version, 'chat'),
    };
  }, [gameId, version]);

  const Renderer = getFederatedGameComponent(gameId, version, 'renderer');

  if (!Renderer) {
    // we may not have this game version -- perhaps the game was started
    // by a newer client?
    return (
      <Box full layout="center center">
        <Icon name="warning" />
        <p>
          This game version is not supported by your client. Please update to
          the latest version.
        </p>
        <Button onClick={() => checkForUpdate().then(() => skipWaiting())}>
          Reload
        </Button>
      </Box>
    );
  }

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
      <RendererProvider value={renderProviderValue}>
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
                  <Renderer />
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
