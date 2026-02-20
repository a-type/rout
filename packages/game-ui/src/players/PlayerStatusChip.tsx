import { Chip, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerStatusChipProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerStatusChip = withGame<PlayerStatusChipProps>(
  function PlayerStatusChip({ gameSuite, playerId }) {
    const status = gameSuite.playerStatuses[playerId] ?? null;

    return status.online ? (
      <Chip color="primary" className="text-sm">
        <Icon name="globe" size={16} />
        <span>Online</span>
      </Chip>
    ) : (
      <Chip color="gray" className="text-sm color-gray-dark">
        <Icon name="x" size={16} />
        <span>Offline</span>
      </Chip>
    );
  },
);
