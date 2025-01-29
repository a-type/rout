import { sdkHooks } from '@/services/publicSdk';
import { LongGameError } from '@long-game/common';
import { TopographyButton } from '@long-game/game-ui';
import { useNavigate } from '@verdant-web/react-router';

export function CreateGame() {
  const mutation = sdkHooks.usePrepareGameSession();

  const navigate = useNavigate();

  const create = async () => {
    const result = await mutation.mutateAsync({ gameId: 'number-guess' });
    const gameSessionId = result?.sessionId;
    if (!gameSessionId) {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Failed to create game session',
      );
    }
    navigate(`/session/${gameSessionId}`);
  };

  return <TopographyButton onClick={create}>New Game</TopographyButton>;
}
