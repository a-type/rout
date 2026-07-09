import { gameModules } from '@/services/games';
import { Button, ButtonProps, Icon } from '@a-type/ui';
import { genericId, PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';
import { Link, useNavigate } from '@verdant-web/react-router';
import { ReactNode } from 'react';

export interface StartHotseatProps extends ButtonProps {
  children?: ReactNode;
  gameId?: string;
}

export function StartHotseat({ children, gameId, ...rest }: StartHotseatProps) {
  const navigate = useNavigate();

  const content = children ?? (
    <>
      <Icon name="phone" />
      <span>New Hotseat</span>
    </>
  );

  if (!gameId) {
    return (
      <Button
        emphasis="primary"
        render={<Link to="?newGame=true&mode=hotseat" />}
        {...rest}
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      emphasis="primary"
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
      {content}
    </Button>
  );
}
