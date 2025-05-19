import { clsx } from '@a-type/ui';
import { hooks } from './gameClient';

export function Player({
  id,
  onClick,
  className,
}: {
  id: string;
  onClick?: () => void;
  className?: string;
}) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const playerName = player.name;
  const playerPosition = player.positions[0];
  return (
    <div
      className={clsx('flex gap-2 items-center text-sm', className)}
      onClick={onClick}
    >
      <span className="uppercase">{playerPosition}</span>
      <span>{playerName}</span>
    </div>
  );
}
