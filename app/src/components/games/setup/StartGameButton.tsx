import { sdkHooks } from '@/services/publicSdk.js';
import { Box, Button, Icon, P } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface StartGameButtonProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const StartGameButton = withGame<StartGameButtonProps>(
  function StartGameButton({ gameSuite, gameSessionId, className }) {
    const { data: pregame } = sdkHooks.useGetGameSessionPregame({
      id: gameSessionId,
    });
    const startMutation = sdkHooks.useStartGameSession();

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
          d="row"
          items="center"
          gap="sm"
          p="sm"
          className={className}
        >
          <Icon name="dots" />
          <P>Waiting for the host to start the game&hellip;</P>
        </Box>
      );
    }

    return (
      <Button
        disabled={cannotStart || startMutation.isPending}
        loading={startMutation.isPending}
        onClick={() => startMutation.mutate({ id: gameSessionId })}
        emphasis={cannotStart ? 'default' : 'primary'}
        className={`w-full disabled:opacity-100 data-[disabled]:opacity-100 ${className ?? ''}`}
        color={cannotStart ? 'gray' : 'primary'}
      >
        <Icon name={cannotStart ? 'x' : 'check'} />
        {insufficientPlayers
          ? 'Need more players'
          : tooManyPlayers
            ? 'Too many players'
            : noGame
              ? 'Select a game'
              : 'Start game'}
      </Button>
    );
  },
);
