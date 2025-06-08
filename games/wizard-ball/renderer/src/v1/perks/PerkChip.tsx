import { clsx, Tooltip } from '@a-type/ui';
import { perks } from '@long-game/game-wizard-ball-definition';
import { PerkEffect } from '../items/PerkEffect';

export function PerkChip({ id }: { id: string }) {
  const perk = perks[id];
  if (!perk) {
    return <div className="p-2 text-red-500">Perk not found</div>;
  }
  const { name, description, rarity } = perk;
  const rarityColor = {
    common: '#9CA3AF',
    uncommon: '#34D399',
    rare: '#60A5FA',
    epic: '#A78BFA',
    legendary: '#FBBF24',
  }[rarity];
  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1">
          <span>{description}</span>
          <PerkEffect effect={perk.effect()} />
        </div>
      }
      className="bg-gray-700 text-gray-100"
    >
      <span
        className={clsx(
          'flex flex-row items-center bg-gray-800 border-solid border-1',
          'p-1 rounded cursor-pointer hover:bg-gray-700',
        )}
        style={{
          borderColor: rarityColor,
          color: rarityColor,
        }}
      >
        {name}
      </span>
    </Tooltip>
  );
}
