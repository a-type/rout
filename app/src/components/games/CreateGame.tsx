import { sdkHooks } from '@/services/publicSdk';
import { Button, ButtonProps, Icon } from '@a-type/ui';
import { LongGameError } from '@long-game/common';
import { withSuspense } from '@long-game/game-ui';
import { useNavigate } from '@verdant-web/react-router';
import { MouseEvent } from 'react';
import { GameLimitUpsellWrapper } from '../subscription/GameLimitUpsellWrapper.js';

export const CreateGame = withSuspense(
  function CreateGame({
    children,
    onClick,
    gameId,
    ...rest
  }: ButtonProps & { gameId?: string }) {
    const mutation = sdkHooks.usePrepareGameSession();
    const {
      data: { count: remaining },
    } = sdkHooks.useGetRemainingGameSessions();

    const navigate = useNavigate();

    const create = async (ev: MouseEvent<HTMLButtonElement>) => {
      const result = await mutation.mutateAsync({ gameId });
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
      <GameLimitUpsellWrapper enabled={remaining === 0}>
        <Button
          color="primary"
          onClick={remaining > 0 ? create : undefined}
          {...rest}
        >
          {children ?? (
            <>
              <Icon name="plus" />
              <span>New Game</span>
            </>
          )}
        </Button>
      </GameLimitUpsellWrapper>
    );
  },
  <Button color="primary" disabled>
    <Icon name="plus" /> New Game
  </Button>,
);
