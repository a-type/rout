import { AvatarList, AvatarListItemRoot, clsx, Icon } from '@a-type/ui';
import { GameSessionPlayerStatus } from '@long-game/common';
import { PlayerInfo, withGame } from '@long-game/game-client';
import { PlayerAvatar } from './PlayerAvatar';

export interface PlayerStatusesProps {
  className?: string;
}

export const PlayerStatuses = withGame<PlayerStatusesProps>(
  function PlayerStatuses({ gameSuite, className }) {
    const memberStatusList = gameSuite.members.map((member) => {
      return {
        player: gameSuite.players[member.id] ?? {
          id: member.id,
          name: 'Loading...',
          color: 'gray',
        },
        status: gameSuite.playerStatuses[member.id] ?? {
          online: false,
          pendingTurn: false,
        },
        hasPlayed:
          gameSuite.gameStatus.status !== 'pending' &&
          !!gameSuite.viewingRound?.turns.some(
            (turn) => turn.playerId === member.id,
          ),
      };
    });

    return (
      <AvatarList count={memberStatusList.length} className={className}>
        {memberStatusList
          .sort((a, b) =>
            a.status.pendingTurn && !b.status.pendingTurn
              ? 1
              : b.status.pendingTurn && !a.status.pendingTurn
              ? -1
              : 0,
          )
          .map(({ status, player, hasPlayed }, index) => (
            <AvatarListItemRoot
              index={index}
              key={player.id}
              className={clsx(
                !hasPlayed && !status?.pendingTurn ? 'opacity-50' : '',
              )}
            >
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
  return (
    <div className={clsx('relative overflow-visible')}>
      <PlayerAvatar playerId={player.id} />
      {hasPlayed || status?.pendingTurn ? (
        <div
          className={clsx(
            'absolute -top-1 -right-2px rounded-full w-16px h-16px flex items-center justify-center',
            hasPlayed ? 'bg-accent-dark' : 'bg-gray-dark',
          )}
        >
          <Icon
            name={hasPlayed ? 'check' : 'clock'}
            className="w-10px h-10px color-white"
          />
        </div>
      ) : null}
    </div>
  );
}
