import { Button, DropdownMenu, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { HotseatBackend, queryClient } from '@long-game/game-client';

export interface HotseatGameSessionMenuProps {
  gameSessionId: PrefixedId<'gs'>;
}

export function HotseatGameSessionMenu({
  gameSessionId,
}: HotseatGameSessionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button
            size="small"
            emphasis="default"
            style={{ minHeight: 0 }}
            aria-label="Game menu"
          />
        }
      >
        <Icon name="dots" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          className="@mode-attention"
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
