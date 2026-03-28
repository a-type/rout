import { sdkHooks } from '@/services/publicSdk.js';
import { Box, Button, clsx, Dialog, Icon, P } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatars } from '@long-game/game-ui';
import { useState } from 'react';
import { GameIcon } from '../GameIcon';
import { GameTitle } from '../GameTitle';

export interface StartGameButtonProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const StartGameButton = withGame<StartGameButtonProps>(
  function StartGameButton({ gameSuite, gameSessionId, className }) {
    const { data: pregame } = sdkHooks.useGetGameSessionPregame({
      id: gameSessionId,
    });
    const [starting, setStarting] = useState(false);
    const startGame = async () => {
      setStarting(true);
      try {
        await gameSuite.startGame();
      } finally {
        setStarting(false);
      }
    };
    const isCreator = pregame?.session?.createdBy === gameSuite.playerId;
    const insufficientPlayers =
      gameSuite.members.length < gameSuite.gameDefinition.minimumPlayers;
    const tooManyPlayers =
      gameSuite.members.length > gameSuite.gameDefinition.maximumPlayers;
    const noGame = !gameSuite.gameId || gameSuite.gameId === 'empty';
    const cannotStart = insufficientPlayers || tooManyPlayers || noGame;

    if (!isCreator) {
      return (
        <Box
          surface
          d="row"
          items="center"
          gap="sm"
          p
          className={clsx('mr-auto self-start', className)}
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
              className={clsx(
                `w-full disabled:opacity-100 data-[disabled]:opacity-100 justify-center`,
                className,
              )}
              color={cannotStart ? 'gray' : 'primary'}
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
              className="w-full max-h-50vmin aspect-1"
            />
            <div className="text-lg font-bold">
              <GameTitle gameId={gameSuite.gameId} />
            </div>
          </Box>
          <Box gap items="center">
            <span className="font-bold">Players:</span>
            <PlayerAvatars />
          </Box>
          <Dialog.Actions className="w-full justify-stretch">
            <Dialog.Close className="grow justify-center">
              Hold on...
            </Dialog.Close>
            <Button
              disabled={cannotStart || starting}
              loading={starting}
              onClick={startGame}
              emphasis="primary"
              className="grow justify-center"
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
