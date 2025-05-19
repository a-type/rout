import { hooks } from './gameClient';

export function Player({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const playerName = player.name;
  const playerPosition = player.positions[0];
  return (
    <div className="flex gap-2 items-center text-sm">
      <span className="uppercase">{playerPosition}</span>
      <span>{playerName}</span>
    </div>
  );
}
