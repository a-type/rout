import { gameModules } from '@/services/games.js';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Card, Dialog, Img } from '@a-type/ui';
import { genericId, LongGameError, PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';
import { TopographyBackground } from '@long-game/visual-components';
import { useNavigate, useSearchParams } from '@verdant-web/react-router';
import { Suspense } from 'react';
import { GameLimitUpsell } from '../subscription/GameLimitUpsell.js';
import { GameList } from './GameList.js';
import { newGameTriggerHandle } from './newGameCommon';
import cls from './NewGameWizard.module.css';

export interface NewGameWizardProps {}

export function NewGameWizard({}: NewGameWizardProps) {
  const [search, setSearch] = useSearchParams();
  const open = search.get('newGame') === 'true';
  const mode = search.get('mode') as 'hotseat' | 'live' | null;

  return (
    <Dialog
      handle={newGameTriggerHandle}
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
  const [_, setSearch] = useSearchParams();

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
                setSearch((prev) => {
                  prev.set('mode', 'live');
                  return prev;
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
                setSearch((prev) => {
                  prev.set('mode', 'hotseat');
                  return prev;
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
    navigate(`/session/${gameSessionId}`, {
      skipTransition: true,
    });
  };

  const createHotseat = async (gameId: string) => {
    const sessionId: PrefixedId<'gs'> = `gs-hotseat-${genericId()}`;
    if (gameId) {
      const version = await gameModules.getGameLatestVersion(gameId);
      const definition = await gameModules.getGameDefinition(gameId, version);
      await HotseatBackend.preSetGame(sessionId, gameId, definition);
    }
    navigate(`/hotseat/${sessionId}`, {
      skipTransition: true,
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
