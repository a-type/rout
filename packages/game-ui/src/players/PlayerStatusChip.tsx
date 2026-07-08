import { Chip, Icon, Text } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerStatusChipProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerStatusChip = withGame<PlayerStatusChipProps>(
  function PlayerStatusChip({ gameSuite, playerId }) {
    const status = gameSuite.playerStatuses[playerId] ?? null;

    return status.online ? (
      <Chip emphasis="primary" className="@mode-primary">
        <Icon name="globe" size={16} />
        <span>Online</span>
      </Chip>
    ) : (
      <Chip emphasis="primary" className="@mode-neutral">
        <Icon name="x" size={16} />
        <Text dim>Offline</Text>
      </Chip>
    );
  },
);
