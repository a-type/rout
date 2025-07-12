import { Box, Chip, clsx, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from './PlayerAvatar';
import { usePlayerThemed } from './usePlayerThemed';

export interface PlayerInfoProps {
  playerId: PrefixedId<'u'>;
  className?: string;
}

export const PlayerInfo = withGame<PlayerInfoProps>(function PlayerInfo({
  gameSuite,
  playerId,
  className,
}) {
  const status = gameSuite.playerStatuses[playerId] ?? null;
  const hasPlayed =
    playerId &&
    gameSuite.viewingRound?.turns.some((turn) => turn.playerId === playerId);
  const isPendingTurn = status?.pendingTurn;
  const player = gameSuite.getPlayer(playerId);
  const { className: themeClass, style } = usePlayerThemed(playerId);

  return (
    <Box d="col" gap className={clsx(themeClass, className)} style={style}>
      <Box gap items="center">
        {player ? (
          <PlayerAvatar
            playerId={player.id}
            className="flex-shrink-0 aspect-1"
            size={64}
          />
        ) : null}
        <div className="text-lg font-bold">
          {player?.displayName ?? 'Anonymous'}
        </div>
      </Box>
      <Box d="row" gap wrap className="max-w-70vw">
        {status.online ? (
          <Chip color="primary" className="text-sm">
            <Icon name="globe" size={16} />
            <span>Online</span>
          </Chip>
        ) : (
          <Chip color="neutral" className="text-sm color-gray-dark">
            <Icon name="x" size={16} />
            <span>Offline</span>
          </Chip>
        )}
        {isPendingTurn && !hasPlayed && (
          <Chip color="primary" className="text-sm theme theme-lemon">
            <Icon name="clock" size={16} />
            <span>Yet to play</span>
          </Chip>
        )}
        {hasPlayed && (
          <Chip color="primary" className="text-sm theme theme-leek">
            <Icon name="check" size={16} />
            <span>Played</span>
          </Chip>
        )}
        {!hasPlayed && !isPendingTurn && (
          <Chip color="neutral" className="text-sm color-black">
            <Icon name="x" size={16} />
            <span>Not playing this round</span>
          </Chip>
        )}
      </Box>
    </Box>
  );
});
