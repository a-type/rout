import { Box, Button, H2, P, RelativeTime, Spinner } from '@a-type/ui';
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
      <Box
        surface
        elevated="xl"
        p="lg"
        col
        gap
        items="center"
        className="fixed left-1/2 top-1/2 -translate-1/2 w-80vw max-w-400px z-1000"
      >
        <H2>Everyone's in!</H2>
        <P>
          Starting the game in{' '}
          <RelativeTime
            countdownSeconds
            disableRelativeText
            value={new Date(startingAt).getTime()}
          />
          ...
        </P>
        <Spinner />
        <Button color="ghost" onClick={() => gameSuite.unreadyUp()}>
          Not ready!
        </Button>
      </Box>
    );
  },
);
