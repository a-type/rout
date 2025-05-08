import { PlayerName, usePlayerThemed } from '@long-game/game-ui';
import { clsx } from '@a-type/ui';

export function ChatPlayer({ playerId }: { playerId: `u-${string}` }) {
  const { className, style } = usePlayerThemed(playerId);
  return (
    <div className={clsx(className)} style={style}>
      <span className="color-primary">
        <PlayerName playerId={playerId} />
      </span>
    </div>
  );
}
