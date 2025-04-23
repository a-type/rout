import { sdkHooks } from '@/services/publicSdk';
import { Button, ButtonProps, Icon } from '@a-type/ui';
import { LongGameError } from '@long-game/common';
import { useNavigate } from '@verdant-web/react-router';
import { MouseEvent } from 'react';

export function CreateGame({ children, onClick, ...rest }: ButtonProps) {
  const mutation = sdkHooks.usePrepareGameSession();

  const navigate = useNavigate();

  const create = async (ev: MouseEvent<HTMLButtonElement>) => {
    const result = await mutation.mutateAsync({ gameId: 'number-guess' });
    const gameSessionId = result?.sessionId;
    if (!gameSessionId) {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Failed to create game session',
      );
    }
    navigate(`/session/${gameSessionId}`);
    onClick?.(ev);
  };

  return (
    <Button color="primary" onClick={create} {...rest}>
      {children ?? (
        <>
          <Icon name="plus" /> New Game
        </>
      )}
    </Button>
  );
}
