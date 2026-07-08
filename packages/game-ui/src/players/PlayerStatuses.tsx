import { AvatarList, AvatarListItemRoot, Icon } from '@a-type/ui';
import { GameSessionPlayerStatus } from '@long-game/common';
import { PlayerInfo, withGame } from '@long-game/game-client';
import { PlayerAvatar } from './PlayerAvatar.js';
import cls from './PlayerStatuses.module.css';

export interface PlayerStatusesProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PlayerStatuses = withGame<PlayerStatusesProps>(
  function PlayerStatuses({ gameSuite, className, style, ...rest }) {
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
      <AvatarList
        count={memberStatusList.length}
        className={className}
        style={{ flexShrink: 0, ...style }}
        {...rest}
      >
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
              style={{
                opacity: !hasPlayed && !status?.pendingTurn ? 0.5 : 1,
              }}
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
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <PlayerAvatar playerId={player.id} interactive />
      {hasPlayed || status?.pendingTurn ? (
        <div className={cls.statusIcon} data-has-played={hasPlayed}>
          <Icon name={hasPlayed ? 'check' : 'clock'} size={10} />
        </div>
      ) : null}
    </div>
  );
}
