import { Avatar, AvatarList, AvatarListItemRoot, clsx } from '@a-type/ui';
import { colors } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerStatusesProps {}

export const PlayerStatuses = withGame<PlayerStatusesProps>(
  function PlayerStatuses({ gameSuite }) {
    const { viewingRound } = gameSuite;

    const memberStatusList = gameSuite.members.map((member) => {
      return {
        player: gameSuite.players[member.id],
        status: gameSuite.playerStatuses[member.id],
        hasPlayed: viewingRound?.turns.some(
          (turn) => turn.playerId === member.id,
        ),
      };
    });

    return (
      <AvatarList count={memberStatusList.length}>
        {memberStatusList.map(({ status, player, hasPlayed }, index) => (
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
                hasPlayed ? 'border-accent' : 'border-gray-5',
              )}
            />
          </AvatarListItemRoot>
        ))}
      </AvatarList>
    );
  },
);
