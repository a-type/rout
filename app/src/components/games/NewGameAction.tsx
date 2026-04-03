import { gameModules } from '@/services/games.js';
import { sdkHooks } from '@/services/publicSdk';
import { Box, ButtonProps, Card, clsx, Dialog, Icon } from '@a-type/ui';
import { genericId, LongGameError, PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';
import { TopographyBackground, withSuspense } from '@long-game/game-ui';
import { useNavigate, useSearchParams } from '@verdant-web/react-router';
import { Suspense } from 'react';
import { GameLimitUpsell } from '../subscription/GameLimitUpsell.js';
import { GameList } from './GameList.js';

export const NewGameAction = withSuspense(function NewGameAction({
  children,
  className,
  ...rest
}: ButtonProps) {
  const [search, setSearch] = useSearchParams();
  const open = search.get('newGame') === 'true';
  const mode = search.get('mode') as 'hotseat' | 'live' | null;

  return (
    <Dialog
      open={!!open}
      onOpenChange={(open) => {
        setSearch((prev) => {
          if (open) {
            prev.set('newGame', 'true');
          } else {
            prev.delete('newGame');
            prev.delete('mode');
          }
          return prev;
        });
      }}
    >
      <Dialog.Trigger
        color="primary"
        className={clsx(
          'overflow-clip border-thick border-primary-dark w-[64px] aspect-1 color-black',
          className,
        )}
        {...rest}
      >
        <TopographyBackground />
        <Icon name="plus" className="relative z-1 w-[24px] h-[24px] stroke-2" />
      </Dialog.Trigger>
      <Dialog.Content
        disableSheet
        className={clsx(
          'w-100lvw h-100lvh max-w-unset max-h-unset',
          'rd-none b-none inset-0',
          'start-end:translate-x-full',
          'translate-0',
          'bg-primary-wash',
        )}
        innerClassName="grow h-full"
      >
        <TopographyBackground />
        <Suspense>
          {mode ? <SelectGameContent /> : <SelectModeContent />}
        </Suspense>
      </Dialog.Content>
    </Dialog>
  );
});

function SelectModeContent() {
  const [_, setSearch] = useSearchParams();

  return (
    <Box col gap className="relative z-1 grow" full>
      <Dialog.Title>Start a New Game</Dialog.Title>
      <Suspense>
        <GameLimitUpsell />
        <Card className="grow">
          <Card.Main
            onClick={() =>
              setSearch((prev) => {
                prev.set('mode', 'live');
                return prev;
              })
            }
          >
            <Card.Title>Play Online</Card.Title>
            <Card.Content>
              Play against your friends online. Take turns at your own pace or
              play in real-time.
            </Card.Content>
          </Card.Main>
        </Card>
        <Card className="grow">
          <Card.Main
            onClick={() =>
              setSearch((prev) => {
                prev.set('mode', 'hotseat');
                return prev;
              })
            }
          >
            <Card.Title>Play Hotseat</Card.Title>
            <Card.Content>
              Take turns passing around this device. Great for road trips or
              trying out a new game.
            </Card.Content>
          </Card.Main>
        </Card>
      </Suspense>
    </Box>
  );
}

function SelectGameContent() {
  const [search] = useSearchParams();
  const mode = search.get('mode') as 'hotseat' | 'live' | null;
  const mutation = sdkHooks.usePrepareGameSession();
  const navigate = useNavigate();

  const createLive = async (gameId: string) => {
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

  const createHotseat = async (gameId: string) => {
    const sessionId: PrefixedId<'gs'> = `gs-hotseat-${genericId()}`;
    if (gameId) {
      const version = await gameModules.getGameLatestVersion(gameId);
      const definition = await gameModules.getGameDefinition(gameId, version);
      await HotseatBackend.preSetGame(sessionId, gameId, definition);
    }
    navigate(`/hotseat/${sessionId}`);
  };

  if (!mode) return null;

  return (
    <GameList hotseat={mode === 'hotseat'}>
      {({ games }) =>
        games.map((game) => (
          <GameList.Item
            gameId={game.id}
            key={game.id}
            canSelect
            owned={game.ownedByPlayer}
            onSelect={() => {
              if (mode === 'hotseat') {
                createHotseat(game.id);
              } else {
                createLive(game.id);
              }
            }}
            selected={false}
          />
        ))
      }
    </GameList>
  );
}
