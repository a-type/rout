import { gameModules } from '@/services/games';
import { Button, ButtonProps, Icon } from '@a-type/ui';
import { genericId, PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';
import { useNavigate } from '@verdant-web/react-router';
import { ReactNode } from 'react';

export interface CreateHotseatProps extends ButtonProps {
  children?: ReactNode;
  gameId?: string;
}

export function CreateHotseat({
  children,
  gameId,
  ...rest
}: CreateHotseatProps) {
  const navigate = useNavigate();
  return (
    <Button
      color="primary"
      onClick={async () => {
        const sessionId: PrefixedId<'gs'> = `gs-hotseat-${genericId()}`;
        if (gameId) {
          const version = await gameModules.getGameLatestVersion(gameId);
          const definition = await gameModules.getGameDefinition(
            gameId,
            version,
          );
          await HotseatBackend.preSetGame(sessionId, gameId, definition);
        }
        navigate(`/hotseat/${sessionId}`);
      }}
      {...rest}
    >
      {children ?? (
        <>
          <Icon name="phone" />
          <span>New Hotseat</span>
        </>
      )}
    </Button>
  );
}
