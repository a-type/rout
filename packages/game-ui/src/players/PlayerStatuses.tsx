import { Avatar, AvatarList, AvatarListItemRoot, clsx } from '@a-type/ui';
import { colors } from '@long-game/common';
import { hooks } from '../hooks';

export interface PlayerStatusesProps {}

export function PlayerStatuses({}: PlayerStatusesProps) {
  const {
    data: { playerStatuses },
  } = hooks.useGetSummary();
  const { data: members } = hooks.useGetMembers();

  const memberStatusList = members.map((member) => {
    return {
      player: member,
      status: playerStatuses[member.id],
    };
  });

  return (
    <AvatarList count={memberStatusList.length}>
      {memberStatusList.map(({ status, player }, index) => (
        <AvatarListItemRoot index={index} key={player.id}>
          <Avatar
            name={player.displayName}
            style={{
              background: colors[player.color].range[3],
              borderWidth: 2,
              borderStyle: 'solid',
            }}
            className={clsx(
              'border border-solid border-2px',
              status.hasPlayed ? 'border-accent' : 'border-gray-5',
            )}
          />
        </AvatarListItemRoot>
      ))}
    </AvatarList>
  );
}
