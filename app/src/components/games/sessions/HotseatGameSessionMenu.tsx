import { sdkHooks } from '@/services/publicSdk';
import { Button, DropdownMenu, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { HotseatBackend } from '@long-game/game-client';

export interface HotseatGameSessionMenuProps {
  gameSessionId: PrefixedId<'gs'>;
}

export function HotseatGameSessionMenu({
  gameSessionId,
}: HotseatGameSessionMenuProps) {
  const queryClient = sdkHooks.useQueryClient();
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={<Button size="small" emphasis="default" className="min-h-0" />}
      >
        <Icon name="dots" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          color="attention"
          onClick={async () => {
            await HotseatBackend.delete(gameSessionId);
            queryClient.invalidateQueries({
              queryKey: ['hotseatGames'],
            });
          }}
        >
          Delete
          <DropdownMenu.ItemRightSlot>
            <Icon name="trash" />
          </DropdownMenu.ItemRightSlot>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
