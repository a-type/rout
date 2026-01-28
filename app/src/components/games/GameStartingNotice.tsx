import { Box, Dialog, RelativeTime, Spinner } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { useEffect, useState } from 'react';

export interface GameStartingNoticeProps {}

export const GameStartingNotice = withGame<GameStartingNoticeProps>(
  function GameStartingNotice({ gameSuite }) {
    const [startingAt, setStartingAt] = useState<string | null>(null);

    useEffect(
      () => gameSuite.subscribe('gameStarting', setStartingAt),
      [gameSuite],
    );
    useEffect(
      () =>
        gameSuite.subscribe('gameStartingCancelled', () => setStartingAt(null)),
      [gameSuite],
    );

    if (!startingAt) {
      return null;
    }

    return (
      <Dialog
        open={!!startingAt}
        onOpenChange={(open) => {
          if (!open) {
            gameSuite.unreadyUp();
          }
        }}
      >
        <Dialog.Content>
          <Box col gap="lg" items="center">
            <Dialog.Title>Everyone's in!</Dialog.Title>
            <Dialog.Description>
              Starting the game in{' '}
              <RelativeTime
                countdownSeconds
                disableRelativeText
                value={new Date(startingAt).getTime()}
              />
              ...
            </Dialog.Description>
            <Spinner />
          </Box>
          <Dialog.Actions>
            <Dialog.Close>Not ready!</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Content>
      </Dialog>
    );
  },
);
