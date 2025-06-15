import { hooks } from '../gameClient';
import { attributeToColor, staminaToText } from '../utils';

export function PlayerStamina({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];

  return (
    <div
      className="flex flex-row gap-2 items-center bg-gray-800 p-1 rounded"
      style={{ color: attributeToColor(player.stamina * 20).text }}
    >
      <span className="font-bold">STA:</span>
      <span>{staminaToText(player.stamina)}</span>
    </div>
  );
}
