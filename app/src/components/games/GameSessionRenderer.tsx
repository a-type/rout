import {
  gameModules,
  gamesReadyPromise,
  getFederatedGameComponent,
} from '@/services/games';
import {
  Box,
  Button,
  ErrorBoundary,
  Heading,
  Icon,
  Popover,
  Select,
  Spinner,
  Text,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  GameSuiteProvider,
  useCreateGameSuite,
  withGame,
} from '@long-game/game-client';
import {
  DndRoot,
  PlayerAvatar,
  PlayerName,
  RendererProvider,
  SpatialChatDraggable,
  SpatialHelpDraggable,
} from '@long-game/game-ui';
import { ScrollTicker } from '@long-game/visual-components';
import { Link, useNavigate } from '@verdant-web/react-router';
import { startTransition, Suspense, use, useMemo } from 'react';
import { Banner } from '../general/Banner.js';
import { PlayerModal } from '../players/PlayerModal.js';
import { PlayerThemeWrapper } from '../players/PlayerThemed.js';
import { SubmitTurn } from '../turns/SubmitTurn.js';
import { GameControls } from './GameControls.js';
import { GameIcon } from './GameIcon.js';
import { GameLayout, GameLayoutSkeleton } from './GameLayout.js';
import cls from './GameSessionRenderer.module.css';
import { GameSetup } from './setup/GameSetup.js';
import { HotseatSetup } from './setup/HotseatSetup.js';

const debugDndSet =
  typeof window !== 'undefined' && window.location.search.includes('debugDnd');
if (debugDndSet) {
  window.sessionStorage.setItem('debugDnd', 'true');
}
const debugDnd =
  debugDndSet || window.sessionStorage.getItem('debugDnd') === 'true';

export interface GameSessionRendererProps {
  gameSessionId: PrefixedId<'gs'>;
  hotseat?: boolean;
}

export function GameSessionRenderer({
  gameSessionId,
  hotseat = false,
}: GameSessionRendererProps) {
  use(gamesReadyPromise);
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
          <ErrorBoundary fallback={<div>Game failed to load</div>}>
            <GameSessionRendererInner hotseat={hotseat} />
          </ErrorBoundary>
        </PlayerThemeWrapper>
      </Suspense>
      <Suspense>
        <PlayerModal />
      </Suspense>
    </GameSuiteProvider>
  );
}

const GameSessionRendererInner = withGame<{ hotseat: boolean }>(
  function GameSessionRendererInner({ gameSuite, hotseat }) {
    return (
      <>
        {gameSuite.gameStatus.status === 'complete' && (
          <Banner>
            <ScrollTicker>
              <Icon name="flag" />
              <span>&nbsp;Game Over!</span>
            </ScrollTicker>
          </Banner>
        )}
        {gameSuite.gameStatus.status === 'abandoned' && (
          <Banner className="@mode-attention">
            <ScrollTicker>
              <span>Game Abandoned 😢</span>
            </ScrollTicker>
            <Popover>
              <Popover.Trigger
                render={<Button size="small" emphasis="ghost" />}
              >
                <Icon name="info" />
                What?
              </Popover.Trigger>
              <Popover.Content side="bottom" align="end">
                <Popover.Title>Game Abandoned</Popover.Title>
                <Popover.Description>
                  One or more players left mid-game. Sorry, we can't keep
                  playing.
                </Popover.Description>
              </Popover.Content>
            </Popover>
          </Banner>
        )}
        {gameSuite.gameStatus.status === 'active' && gameSuite.pickingPlayer ? (
          <HotseatPlayerSelector />
        ) : (
          <Suspense fallback={<GameLayoutSkeleton />}>
            <GameplayRenderer hotseat={hotseat} />
          </Suspense>
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
        LinkComponent: Link,
      };
    }, [gameId, version]);

    const Renderer = getFederatedGameComponent(gameId, version, 'renderer');
    const navigate = useNavigate();

    const providerValue = useMemo(
      () => ({
        ...renderProviderValue,
        navigate,
      }),
      [navigate],
    );

    return (
      <RendererProvider value={providerValue}>
        <DndRoot debug={debugDnd} className={cls.dnd}>
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
                    <HotseatSetup className="w-full" />
                  ) : (
                    <GameSetup gameSessionId={sessionId} className="w-full" />
                  )
                ) : (
                  <div className={cls.main}>
                    {hotseat && <HotseatBanner />}
                    <ErrorBoundary
                      fallback={(props) => (
                        <Box col>
                          <Text
                            render={<h1 />}
                            emphasis="ambient"
                            uppercase
                            dim
                          >
                            Game failed to load
                          </Text>
                          <Text render={<p />} emphasis="ambient" dim>
                            {props.error.message}
                          </Text>
                          <Button onClick={props.clearError}>Try Again</Button>
                        </Box>
                      )}
                    >
                      <Renderer />
                      {/* using key to reset state when changing games */}
                      <SubmitTurn key={sessionId} />
                    </ErrorBoundary>
                  </div>
                )}
              </Suspense>
              {gameSuite.gameStatus.status !== 'pending' && (
                <>
                  <ErrorBoundary>
                    <Suspense>
                      <SpatialChatDraggable className={cls.spatialChat} />
                    </Suspense>
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <Suspense>
                      <SpatialHelpDraggable className={cls.spatialHelp} />
                    </Suspense>
                  </ErrorBoundary>
                </>
              )}
            </GameLayout.Main>
            <GameControls pregame={gameSuite.gameStatus.status === 'pending'} />
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
    <Box full col gap layout="center center" grow>
      <Box col gap="xs">
        <Text render={<h1 />} emphasis="ambient" uppercase dim>
          Hotseat
        </Text>
        <Heading render={<h2 />} emphasis="secondary">
          Round {gameSuite.latestRoundIndex + 1}
        </Heading>
        <GameIcon
          gameId={gameSuite.gameId}
          style={{ width: 200, height: 200, borderRadius: 'var(--m-rd)' }}
        />
        <Heading render={<h3 />} emphasis="ambient">
          Select Player
        </Heading>
        <Box gap="sm" items="stretch" full="width" className={cls.playerGrid}>
          {members.map((member) => (
            <Button
              key={member.id}
              onClick={() => {
                startTransition(() => {
                  gameSuite.switchPlayer(member.id);
                });
              }}
              size="small"
              emphasis={
                gameSuite.playerStatuses[member.id]?.pendingTurn
                  ? 'default'
                  : 'ghost'
              }
              className={cls.hotseatPlayerButton}
            >
              <PlayerAvatar playerId={member.id} size={40} />
              <Box gap="sm" col items="start">
                <Text emphasis="primary" bold>
                  <PlayerName playerId={member.id} disableYou />
                </Text>
                <Text emphasis="ambient" dim>
                  {/* FIXME: clean up */}
                  {gameSuite.playerStatuses[member.id]?.pendingTurn
                    ? 'Your turn!'
                    : gameSuite.latestRound.turns.find(
                          (t) => t.playerId === member.id,
                        )
                      ? 'Played'
                      : 'Not playing'}
                </Text>
              </Box>
            </Button>
          ))}
        </Box>
        <Button
          render={<Link to="/" />}
          emphasis="ghost"
          size="small"
          align="start"
        >
          <Icon name="arrowLeft" />
          Back to Games
        </Button>
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
      color="primary"
      surface
      p
      gap
      justify="between"
      items="center"
      className={className}
    >
      <Text bold>Hotseat</Text>
      <Select
        value={gameSuite.playerId}
        onValueChange={(value) => value && gameSuite.switchPlayer(value)}
      >
        <Select.Trigger size="small">
          <Select.Value>
            {(playerId) => (
              <Box gap="sm" items="center">
                <PlayerAvatar playerId={playerId} size={24} />
                <PlayerName disableYou playerId={playerId} />
              </Box>
            )}
          </Select.Value>
        </Select.Trigger>
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
