import { Tooltip } from '@a-type/ui';
import { perks } from '@long-game/game-wizard-ball-definition';

export function PerkChip({ id }: { id: string }) {
  const perk = perks[id];
  if (!perk) {
    return <div className="p-2 text-red-500">Perk not found</div>;
  }
  const { name, description } = perk;
  return (
    <Tooltip content={description} className="bg-gray-700 text-gray-100">
      <span className="bg-gray-800 p-1 rounded cursor-pointer hover:bg-gray-700">
        {name}
      </span>
    </Tooltip>
  );
}
