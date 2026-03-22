import { gameModules } from '@/services/games.js';
import { sdkHooks } from '@/services/publicSdk';
import { Box, ButtonProps, Card, clsx, Icon, QuickAction } from '@a-type/ui';
import { genericId, LongGameError, PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';
import { TopographyBackground, withSuspense } from '@long-game/game-ui';
import { useNavigate } from '@verdant-web/react-router';
import { Suspense } from 'react';
import { GameLimitUpsell } from '../subscription/GameLimitUpsell.js';

export const NewGameAction = withSuspense(function NewGameAction({
  children,
  gameId,
  className,
  ...rest
}: ButtonProps & { gameId?: string }) {
  const mutation = sdkHooks.usePrepareGameSession();
  const navigate = useNavigate();

  const createLive = async () => {
    const result = await mutation.mutateAsync({ gameId });
    const gameSessionId = result?.sessionId;
    if (!gameSessionId) {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Failed to create game session',
      );
    }
    navigate(`/session/${gameSessionId}`);
  };

  const createHotseat = async () => {
    const sessionId: PrefixedId<'gs'> = `gs-hotseat-${genericId()}`;
    if (gameId) {
      const version = await gameModules.getGameLatestVersion(gameId);
      const definition = await gameModules.getGameDefinition(gameId, version);
      await HotseatBackend.preSetGame(sessionId, gameId, definition);
    }
    navigate(`/hotseat/${sessionId}`);
  };

  return (
    <QuickAction>
      <QuickAction.Trigger
        color="primary"
        className={clsx(
          'overflow-clip border-thick border-primary-dark w-[64px] aspect-1',
          className,
        )}
        {...rest}
      >
        <TopographyBackground />
        <Icon name="plus" className="relative z-1 w-[24px] h-[24px] stroke-2" />
      </QuickAction.Trigger>
      <QuickAction.Content className="w-400px max-w-screen p-md">
        <TopographyBackground />
        <Box col gap>
          <Suspense>
            <GameLimitUpsell />
            <Card>
              <Card.Main onClick={createLive}>
                <Card.Title>Play Online</Card.Title>
                <Card.Content>
                  Play against your friends online. Take turns at your own pace
                  or play in real-time.
                </Card.Content>
              </Card.Main>
            </Card>
            <Card>
              <Card.Main onClick={createHotseat}>
                <Card.Title>Play Hotseat</Card.Title>
                <Card.Content>
                  Take turns passing around this device. Great for road trips or
                  trying out a new game.
                </Card.Content>
              </Card.Main>
            </Card>
          </Suspense>
        </Box>
      </QuickAction.Content>
    </QuickAction>
  );
});
