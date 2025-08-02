import { Button, ButtonProps, Icon } from '@a-type/ui';
import { genericId } from '@long-game/common';
import { useNavigate } from '@verdant-web/react-router';
import { ReactNode } from 'react';

export interface CreateHotseatProps extends ButtonProps {
  children?: ReactNode;
}

export function CreateHotseat({ children, ...rest }: CreateHotseatProps) {
  const navigate = useNavigate();
  return (
    <Button
      color="primary"
      onClick={async () => {
        const gameId = `gs-hotseat-${genericId()}`;
        navigate(`/hotseat/${gameId}`);
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
