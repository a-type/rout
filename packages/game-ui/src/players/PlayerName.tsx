import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerNameProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerName = withGame<PlayerNameProps>(function PlayerName({
  gameSuite,
  playerId,
}) {
  const player = gameSuite.getPlayer(playerId);
  return <>{player.displayName}</>;
});
