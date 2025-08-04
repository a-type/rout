import { gameModules, getFederatedGameComponent } from '@/services/games';
import {
  Box,
  Button,
  clsx,
  ErrorBoundary,
  H1,
  Icon,
  Select,
  Spinner,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  GameSuiteProvider,
  useCreateGameSuite,
  withGame,
} from '@long-game/game-client';
import {
  DelayedSubmitUndo,
  DndRoot,
  PlayerAvatar,
  PlayerName,
  RendererProvider,
  SpatialChatDraggable,
} from '@long-game/game-ui';
import { startTransition, Suspense, useMemo } from 'react';
import { ScrollTicker } from '../general/ScrollTicker.js';
import { PlayerThemeWrapper } from '../players/PlayerThemed.js';
import { GameAbandonedNotice } from './GameAbandonedNotice.js';
import { GameControls } from './GameControls.js';
import { GameLayout } from './GameLayout.js';
import { GameSetup } from './GameSetup.js';
import { HotseatSetup } from './HotseatSetup.js';

export interface GameSessionRendererProps {
  gameSessionId: PrefixedId<'gs'>;
  hotseat?: boolean;
}

export function GameSessionRenderer({
  gameSessionId,
  hotseat = false,
}: GameSessionRendererProps) {
  const gameSuite = useCreateGameSuite(gameSessionId, gameModules, hotseat);

  return (
    <GameSuiteProvider value={gameSuite}>
      <Suspense
        fallback={
          <Box full layout="center center">
            <Spinner />
          </Box>
        }
      >
        <PlayerThemeWrapper>
          <GameSessionRendererInner hotseat={hotseat} />
        </PlayerThemeWrapper>
      </Suspense>
    </GameSuiteProvider>
  );
}

const GameSessionRendererInner = withGame<{ hotseat: boolean }>(
  function GameSessionRendererInner({ gameSuite, hotseat }) {
    return (
      <>
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
        {gameSuite.gameStatus.status === 'active' && gameSuite.pickingPlayer ? (
          <HotseatPlayerSelector />
        ) : (
          <GameplayRenderer hotseat={hotseat} />
        )}
      </>
    );
  },
);

const GameplayRenderer = withGame<{ hotseat: boolean }>(
  function GameplayRenderer({ gameSuite, hotseat }) {
    const gameId = gameSuite.gameId;
    const version = gameSuite.gameVersion;
    const sessionId = gameSuite.gameSessionId;
    const renderProviderValue = useMemo(() => {
      return {
        ChatRendererComponent: getFederatedGameComponent(
          gameId,
          version,
          'chat',
        ),
      };
    }, [gameId, version]);

    const Renderer = getFederatedGameComponent(gameId, version, 'renderer');

    return (
      <RendererProvider value={renderProviderValue}>
        <DndRoot className="w-full flex-1-0-0 min-h-0 flex flex-col">
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
                  hotseat ? (
                    <HotseatSetup
                      gameSessionId={sessionId}
                      className="w-full"
                    />
                  ) : (
                    <GameSetup gameSessionId={sessionId} className="w-full" />
                  )
                ) : (
                  <>
                    {hotseat && <HotseatBanner />}
                    <Renderer />
                  </>
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
    );
  },
);

const HotseatPlayerSelector = withGame(function HotseatPlayerSelector({
  gameSuite,
}) {
  const members = gameSuite.members;

  return (
    <Box full col gap layout="center center">
      <Box col gap="xs">
        <div className="text-xs uppercase color-gray-dark">Hotseat</div>
        <div className="text-sm">Round {gameSuite.latestRoundIndex + 1}</div>
        <H1>Select Player</H1>
        <Box className="grid grid-auto-rows-[1fr] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
          {members.map((member) => (
            <Button
              key={member.id}
              onClick={() => {
                startTransition(() => {
                  gameSuite.switchPlayer(member.id);
                });
              }}
              className={clsx('p-0 rounded-full')}
              color={
                gameSuite.playerStatuses[member.id]?.pendingTurn
                  ? 'default'
                  : 'ghost'
              }
            >
              <PlayerAvatar
                playerId={member.id}
                size={40}
                className="rounded-full"
              />
              <Box gap="sm" col items="start">
                <PlayerName playerId={member.id} disableYou />
                <div className="text-xs color-gray-dark">
                  {/* FIXME: clean up */}
                  {gameSuite.playerStatuses[member.id]?.pendingTurn
                    ? 'Your turn!'
                    : gameSuite.latestRound.turns.find(
                          (t) => t.playerId === member.id,
                        )
                      ? 'Played'
                      : 'Not playing'}
                </div>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

const HotseatBanner = withGame<{ className?: string }>(function HotseatBanner({
  gameSuite,
  className,
}) {
  return (
    <Box
      surface="primary"
      p
      gap
      justify="between"
      items="center"
      className={className}
    >
      <div className="font-bold">Hotseat</div>
      <Select
        value={gameSuite.playerId}
        onValueChange={(value) => gameSuite.switchPlayer(value)}
      >
        <Select.Trigger size="small" />
        <Select.Content>
          {gameSuite.members.map((member) => (
            <Select.Item key={member.id} value={member.id}>
              <Box gap="sm" items="center">
                <PlayerAvatar playerId={member.id} size={24} />
                <PlayerName disableYou playerId={member.id} />
              </Box>
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </Box>
  );
});
