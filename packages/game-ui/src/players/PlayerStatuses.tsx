import { Avatar, AvatarList, AvatarListItemRoot, clsx } from '@a-type/ui';
import { colors } from '@long-game/common';
import { useGameSession } from '@long-game/game-client/client';

export interface PlayerStatusesProps {}

export function PlayerStatuses({}: PlayerStatusesProps) {
  const { state } = useGameSession();

  return (
    <AvatarList count={state.playerStatuses.length}>
      {state.playerStatuses.map((status, index) => (
        <AvatarListItemRoot index={index} key={status.player.id}>
          <Avatar
            name={status.player.name}
            style={{
              background: colors[status.player.color].range[3],
              borderWidth: 2,
              borderStyle: 'solid',
            }}
            className={clsx(
              'border border-solid border-2px',
              status.hasPlayedTurn ? 'border-accent' : 'border-gray-5',
            )}
          />
        </AvatarListItemRoot>
      ))}
    </AvatarList>
  );
}
