import { Box, clsx, TextSkeleton } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { withSuspense } from '../withSuspense.js';
import { PlayerAvatar } from './PlayerAvatar.js';
import { PlayerFriendChip } from './PlayerFriendChip.js';
import { PlayerStatusChip } from './PlayerStatusChip.js';
import { PlayerTurnChip } from './PlayerTurnChip.js';
import { usePlayerThemed } from './usePlayerThemed.js';

export interface PlayerInfoProps {
  playerId: PrefixedId<'u'>;
  className?: string;
}

export const PlayerInfo = withSuspense(
  withGame<PlayerInfoProps>(function PlayerInfo({
    gameSuite,
    playerId,
    className,
  }) {
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
          <PlayerStatusChip playerId={playerId} />
          <PlayerTurnChip playerId={playerId} />
          <PlayerFriendChip playerId={playerId} />
        </Box>
      </Box>
    );
  }),
  <Box col gap>
    <TextSkeleton maxLength={20} />
    <TextSkeleton maxLength={40} />
  </Box>,
);
