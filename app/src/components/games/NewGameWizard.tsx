import { gameModules } from '@/services/games.js';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Card, Dialog, Img } from '@a-type/ui';
import { genericId, LongGameError, PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';
import { TopographyBackground } from '@long-game/visual-components';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Suspense } from 'react';
import { GameLimitUpsell } from '../subscription/GameLimitUpsell.js';
import { GameList } from './GameList.js';
import { newGameTriggerHandle } from './newGameCommon';
import cls from './NewGameWizard.module.css';

export interface NewGameWizardProps {}

export function NewGameWizard({}: NewGameWizardProps) {
  const { newGame: open, mode } = useSearch({
    strict: false,
  });
  const navigate = useNavigate();

  return (
    <Dialog
      handle={newGameTriggerHandle}
      open={!!open}
      onOpenChange={(open) => {
        navigate({
          search: (prev) => {
            if (open) {
              return { ...prev, newGame: true } as never;
            } else {
              const { newGame, mode, ...rest } = prev;
              return rest as never;
            }
          },
        });
      }}
    >
      <Dialog.Content
        disableSheet
        className={cls.content}
        innerClassName={cls.contentInner}
      >
        <TopographyBackground />
        <Suspense>
          {mode ? <SelectGameContent /> : <SelectModeContent />}
        </Suspense>
      </Dialog.Content>
    </Dialog>
  );
}

function SelectModeContent() {
  const navigate = useNavigate();

  return (
    <Box col gap grow full className={cls.selectContent}>
      <Dialog.Title className="font-fancy">New Game</Dialog.Title>
      <Suspense>
        <GameLimitUpsell />
        <Box gap justify="stretch" items="stretch" className={cls.selectBox}>
          <Card className={cls.card} size="lg">
            <Card.Image
              render={<Img fit="cover" src="/illustrations/online.png" />}
            />
            <Card.Main
              onClick={() =>
                navigate({
                  from: '/',
                  search: (prev) => ({ ...prev, mode: 'live' }),
                })
              }
              className={cls.cardMain}
            >
              <Card.Title>Play Online</Card.Title>
              <Card.Content>
                Play against your friends online. Take turns at your own pace or
                play in real-time.
              </Card.Content>
            </Card.Main>
          </Card>
          <Card className={cls.card} size="lg">
            <Card.Image
              render={<Img fit="cover" src="/illustrations/hotseat.png" />}
            />
            <Card.Main
              onClick={() =>
                navigate({
                  from: '/',
                  search: (prev) => ({ ...prev, mode: 'hotseat' }),
                })
              }
              className={cls.cardMain}
            >
              <Card.Title>Play Hotseat</Card.Title>
              <Card.Content>
                Take turns passing around this device. Great for road trips or
                trying out a new game.
              </Card.Content>
            </Card.Main>
          </Card>
        </Box>
      </Suspense>
    </Box>
  );
}

function SelectGameContent() {
  const { mode } = useSearch({ strict: false });
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
    navigate({
      to: `/session/${gameSessionId}`,
      viewTransition: false,
    });
  };

  const createHotseat = async (gameId: string) => {
    const sessionId: PrefixedId<'gs'> = `gs-hotseat-${genericId()}`;
    if (gameId) {
      const version = await gameModules.getGameLatestVersion(gameId);
      const definition = await gameModules.getGameDefinition(gameId, version);
      await HotseatBackend.preSetGame(sessionId, gameId, definition);
    }
    navigate({
      to: `/hotseat/${sessionId}`,
      viewTransition: false,
    });
  };

  if (!mode) return null;

  return (
    <Box col gap>
      <Dialog.Title className="font-fancy">Pick a Game</Dialog.Title>
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
    </Box>
  );
}
