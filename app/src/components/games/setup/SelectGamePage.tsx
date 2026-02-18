import { sdkHooks } from '@/services/publicSdk';
import { Box, H2, P } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { GamePicker } from './GamePicker';

export interface SelectGamePageProps {
  gameSessionId: PrefixedId<'gs'>;
}

export const SelectGamePage = withGame<SelectGamePageProps>(
  function SelectGamePage({ gameSuite, gameSessionId }) {
    const updateGameMutation = sdkHooks.useUpdateGameSession();
    const { data: pregame } = sdkHooks.useGetGameSessionPregame({
      id: gameSessionId,
    });
    const { data: sessionAvailableGames } = sdkHooks.useGetAvailableGames({
      id: gameSessionId,
    });

    return (
      <Box col gap>
        <H2>Choose a game</H2>
        <P>Start with a game to play. You can change this later!</P>
        <GamePicker
          value={gameSuite.gameId}
          loading={updateGameMutation.isPending}
          gameSessionId={gameSessionId}
          sessionCreator={pregame.session.createdBy}
          availableGames={sessionAvailableGames}
        />
      </Box>
    );
  },
);
