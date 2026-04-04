import { Box, Button, Dialog, Icon } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { Suspense } from 'react';
import { GameIcon } from '../GameIcon.js';
import { GameTitle } from '../GameTitle.js';
import { GamePicker } from './GamePicker.js';

export const GameSelectionBanner = withGame(function GameSelectionBanner({
  gameSuite,
}) {
  const gameId = gameSuite.gameId;

  if (!gameId || gameId === 'empty') {
    return null;
  }

  return (
    <Box
      items="center"
      justify="between"
      full="width"
      gap="sm"
      className="z-1 text-lg md:text-xl"
    >
      <div className="flex flex-row gap-md items-center">
        <GameIcon
          gameId={gameId}
          className="h-48px aspect-1 rounded-sm border-black border-thin border-solid"
        />
        <div className="bg-white px-sm py-xs rounded-sm">
          <GameTitle gameId={gameId} />
        </div>
      </div>
      {gameSuite.youAreLeader && (
        <Dialog>
          <Dialog.Trigger render={<Button size="small" emphasis="light" />}>
            <Icon name="convert" />
            Change
          </Dialog.Trigger>
          <Dialog.Content width="lg">
            <Dialog.Title>Change Game</Dialog.Title>
            <Suspense>
              <GamePicker hotseat={gameSuite.isHotseat} value={gameId} />
            </Suspense>
            <Dialog.Actions>
              <Dialog.Close />
            </Dialog.Actions>
          </Dialog.Content>
        </Dialog>
      )}
    </Box>
  );
});
