import { Box } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { hooks } from './gameClient.js';

export interface PlayerAttributionProps {
  playerId: PrefixedId<'u'>;
  className?: string;
}

export const PlayerAttribution = hooks.withGame<PlayerAttributionProps>(
  function PlayerAttribution({ playerId, className }) {
    return (
      <Box gap items="center" className={className}>
        <PlayerAvatar playerId={playerId} />
        <PlayerName playerId={playerId} />
      </Box>
    );
  },
);
