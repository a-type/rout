import { sdkHooks } from '@/services/publicSdk';
import {
  Button,
  ButtonProps,
  clsx,
  DropdownMenu,
  Icon,
  toast,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';

export interface GameSessionMenuProps extends ButtonProps {
  sessionId: PrefixedId<'gs'>;
  canDelete?: boolean;
  canAbandon?: boolean;
  onDeleteOrAbandon?: () => void;
}

export function GameSessionMenu({
  sessionId,
  canDelete,
  canAbandon,
  onDeleteOrAbandon,
  className,
  ...rest
}: GameSessionMenuProps) {
  const deleteSession = sdkHooks.useDeleteGameSession();
  const abandonSession = sdkHooks.useAbandonGameSession();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button
            size="small"
            emphasis="default"
            className={clsx('min-h-0', className)}
            {...rest}
          />
        }
      >
        <Icon name="dots" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {canDelete && (
          <DropdownMenu.Item
            onClick={async () => {
              await deleteSession.mutateAsync({ id: sessionId });
              toast(`Game deleted.`);
              onDeleteOrAbandon?.();
            }}
            color="attention"
          >
            Delete
            <DropdownMenu.ItemRightSlot>
              <Icon name="trash" />
            </DropdownMenu.ItemRightSlot>
          </DropdownMenu.Item>
        )}
        {canAbandon && (
          <DropdownMenu.Item
            onClick={async () => {
              const confirmed = confirm(
                'This will end the game for everyone. Other players will be notified the game is over. Are you sure you want to abandon this game?',
              );
              if (!confirmed) return;
              await abandonSession.mutateAsync({ id: sessionId });
              onDeleteOrAbandon?.();
              toast(`You abandoned this game.`);
            }}
            color="attention"
          >
            Abandon
            <DropdownMenu.ItemRightSlot>
              <Icon name="flag" />
            </DropdownMenu.ItemRightSlot>
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
