import { sdkHooks } from '@/services/publicSdk';
import { Button, ButtonProps, Icon } from '@a-type/ui';
import { LongGameError } from '@long-game/common';
import { useNavigate } from '@verdant-web/react-router';
import { ReactNode } from 'react';

export interface StartOnlineProps extends ButtonProps {
  children?: ReactNode;
  gameId?: string;
}

export function StartOnline({ children, gameId, ...rest }: StartOnlineProps) {
  const mutation = sdkHooks.usePrepareGameSession();
  const navigate = useNavigate();

  const createLive = async () => {
    const result = await mutation.mutateAsync({ gameId });
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
    <Button emphasis="primary" onClick={createLive} {...rest}>
      {children ?? (
        <>
          <Icon name="gamePiece" />
          <span>Play Online</span>
        </>
      )}
    </Button>
  );
}
