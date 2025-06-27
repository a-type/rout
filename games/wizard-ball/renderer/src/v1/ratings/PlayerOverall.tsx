import { hooks } from '../gameClient';
import { attributeToColor, numberToLetter } from '../utils';
import { getPlayerAttributes } from './useAttributes';

export function PlayerOverall({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const attr = getPlayerAttributes(player, finalState.league);
  const overall = attr.baseAttributes.overall + attr.attributeMod.overall;

  return (
    <div
      className="flex flex-row gap-2 items-center bg-white p-1 rounded"
      style={{ color: attributeToColor(overall, 120).text }}
    >
      <span className="font-bold">OVR:</span>
      <span>{numberToLetter(overall / 6)}</span>
    </div>
  );
}
