import { Button } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { Link } from '@verdant-web/react-router';
import { usePlayerThemed } from './usePlayerThemed';

export interface PlayerHandleProps {
  playerId: PrefixedId<'u'>;
}

export const PlayerHandle = withGame<PlayerHandleProps>(function PlayerHandle({
  gameSuite,
  playerId,
}) {
  const player = gameSuite.getPlayer(playerId);
  const { className, style } = usePlayerThemed(playerId);

  return (
    <Button
      className={className}
      style={style}
      size="small"
      emphasis="ghost"
      render={<Link to={`?playerId=${playerId}`} />}
    >
      @{player?.displayName ?? '???'}
    </Button>
  );
});
