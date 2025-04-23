import { Avatar, AvatarList, AvatarListItemRoot, clsx, Icon } from '@a-type/ui';
import { GameSessionPlayerStatus } from '@long-game/common';
import { PlayerInfo, withGame } from '@long-game/game-client';
import { usePlayerThemed } from './usePlayerThemed';

export interface PlayerStatusesProps {
  className?: string;
}

export const PlayerStatuses = withGame<PlayerStatusesProps>(
  function PlayerStatuses({ gameSuite, className }) {
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
      <AvatarList count={memberStatusList.length} className={className}>
        {memberStatusList.map(({ status, player, hasPlayed }, index) => (
          <AvatarListItemRoot index={index} key={player.id}>
            <PlayerStatusAvatar
              player={player}
              status={status}
              hasPlayed={hasPlayed}
            />
          </AvatarListItemRoot>
        ))}
      </AvatarList>
    );
  },
);

function PlayerStatusAvatar({
  player,
  status,
  hasPlayed,
}: {
  player: PlayerInfo;
  status?: GameSessionPlayerStatus;
  hasPlayed: boolean;
}) {
  const { className, style } = usePlayerThemed(player.id);
  return (
    <div className={clsx('relative overflow-visible', className)} style={style}>
      <Avatar
        name={player.displayName}
        imageSrc={player.imageUrl}
        className={clsx(
          'border border-solid border-2px',
          status?.online ? 'border-primary' : 'border-gray',
        )}
      />
      {hasPlayed && (
        <div className="absolute -top-1 -left-1 bg-primary-dark rounded-full w-16px h-16px flex items-center justify-center">
          <Icon name="check" className="w-10px h-10px color-white" />
        </div>
      )}
    </div>
  );
}
