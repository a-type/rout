import { clsx } from '@a-type/ui';
import { ShipPartData } from '@long-game/game-gunboats-definition/v1';
import { usePlayerThemed } from '@long-game/game-ui';
import { hooks } from './gameClient';

export interface ShipPartProps {
  data: ShipPartData;
  className?: string;
}

export const ShipPart = hooks.withGame<ShipPartProps>(function ShipPart({
  gameSuite,
  data,
  className,
}) {
  const playerId = data.playerId;
  const themed = usePlayerThemed(playerId);
  return (
    <div
      className={clsx(
        themed.className,
        'w-full h-full bg-primary',
        data.hit && 'bg-attention',
        className,
      )}
      style={themed.style}
    />
  );
});
