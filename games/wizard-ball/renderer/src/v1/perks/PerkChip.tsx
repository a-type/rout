import { clsx } from '@a-type/ui';
import { perks } from '@long-game/game-wizard-ball-definition';
import { PerkEffect } from '../items/PerkEffect.js';
import { TooltipPlus } from '../TooltipPlus.js';

export function PerkChip({ id }: { id: string }) {
  const perk = perks[id];
  if (!perk) {
    return <div className="p-2 color-attention-dark">Perk not found</div>;
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
    <TooltipPlus
      content={
        <div className="flex flex-col gap-1">
          <span>{description}</span>
          <PerkEffect effect={perk.effect()} />
        </div>
      }
      className="bg-gray-wash color-gray-ink"
    >
      <span
        className={clsx(
          'flex flex-row items-center bg-white border-solid border-1',
          'p-1 rounded cursor-pointer hover:bg-gray-wash',
        )}
        style={{
          borderColor: rarityColor,
          color: rarityColor,
        }}
      >
        {name}
      </span>
    </TooltipPlus>
  );
}
