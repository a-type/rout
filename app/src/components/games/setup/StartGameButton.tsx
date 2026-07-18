import { Box, Button, Dialog, Icon, P, Text } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { PlayerAvatars } from '@long-game/game-ui';
import { useState } from 'react';
import { GameIcon } from '../GameIcon';
import { GameTitle } from '../GameTitle';

export interface StartGameButtonProps {
  className?: string;
}

export const StartGameButton = withGame<StartGameButtonProps>(
  function StartGameButton({ gameSuite, className }) {
    const [starting, setStarting] = useState(false);
    const startGame = async () => {
      setStarting(true);
      try {
        await gameSuite.startGame();
      } finally {
        setStarting(false);
      }
    };
    const insufficientPlayers =
      gameSuite.members.length < gameSuite.gameDefinition.minimumPlayers;
    const tooManyPlayers =
      gameSuite.members.length > gameSuite.gameDefinition.maximumPlayers;
    const noGame = !gameSuite.gameId || gameSuite.gameId === 'empty';
    const cannotStart = insufficientPlayers || tooManyPlayers || noGame;

    if (!gameSuite.youAreLeader) {
      return (
        <Box
          surface
          items="center"
          justify="center"
          gap="sm"
          p
          full="width"
          style={{ marginRight: 'auto', alignSelf: 'start' }}
          className={className}
        >
          <Icon name="dots" />
          <P>Waiting for the host to start the game&hellip;</P>
        </Box>
      );
    }

    return (
      <Dialog>
        <Dialog.Trigger
          render={
            <Button
              disabled={cannotStart || starting}
              emphasis={cannotStart ? 'default' : 'primary'}
              className={className}
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            />
          }
        >
          <PlayerAvatars />
          {insufficientPlayers
            ? 'Need more players'
            : tooManyPlayers
              ? 'Too many players'
              : noGame
                ? 'Select a game'
                : 'Start game'}
          <Icon name={cannotStart ? 'x' : 'arrowRight'} />
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Ready?</Dialog.Title>
          <Dialog.Description>
            Make sure everything looks right - once the game starts, you won't
            be able to change it.
          </Dialog.Description>
          <Box col items="center" p>
            <GameIcon
              gameId={gameSuite.gameId}
              style={{
                width: '100%',
                maxHeight: '50vmin',
                aspectRatio: '1 / 1',
                objectFit: 'contain',
                borderRadius: 'var(--m-rd-sm)',
              }}
            />
            <Text emphasis="primary" bold>
              <GameTitle gameId={gameSuite.gameId} />
            </Text>
          </Box>
          <Box gap items="center">
            <Text bold>Players:</Text>
            <PlayerAvatars />
          </Box>
          <Dialog.Actions full="width" justify="stretch">
            <Dialog.Close style={{ flex: 1, justifyContent: 'center' }}>
              Hold on...
            </Dialog.Close>
            <Button
              disabled={cannotStart || starting}
              loading={starting}
              onClick={startGame}
              emphasis="primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Let's go!
              <Icon name="check" />
            </Button>
          </Dialog.Actions>
        </Dialog.Content>
      </Dialog>
    );
  },
);
