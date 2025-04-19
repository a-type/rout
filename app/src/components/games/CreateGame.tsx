import { sdkHooks } from '@/services/publicSdk';
import { Button, Icon } from '@a-type/ui';
import { LongGameError } from '@long-game/common';
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

  return (
    <Button color="primary" onClick={create}>
      <Icon name="plus" /> New Game
    </Button>
  );
}
