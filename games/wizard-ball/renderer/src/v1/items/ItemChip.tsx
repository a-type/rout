import { clsx } from '@a-type/ui';
import { itemData } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient.js';
import { TooltipPlus } from '../TooltipPlus.js';
import { PerkEffect } from './PerkEffect.js';

export function ItemDefChip({ id }: { id: string }) {
  const itemDef = itemData[id];
  if (!itemDef) {
    return <span className="color-attention-dark">Unknown Item</span>;
  }
  const itemName = itemDef.name;
  const itemRarity = itemDef.rarity;
  const itemEffect = itemDef.effect();
  const rarityColor = {
    common: '#9CA3AF',
    uncommon: '#34D399',
    rare: '#60A5FA',
    epic: '#A78BFA',
    legendary: '#FBBF24',
  }[itemRarity];
  return (
    <TooltipPlus
      className="bg-gray-wash color-gray-ink"
      content={
        <div className="flex flex-col gap-1">
          <span>{itemDef.description}</span>
          <PerkEffect effect={itemEffect} />
        </div>
      }
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
        {itemDef.icon} {itemName}
      </span>
    </TooltipPlus>
  );
}

export function ItemChip({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const item = finalState.league.itemLookup[id];
  if (!item) {
    return <span className="color-attention-dark">Unknown Item</span>;
  }
  return <ItemDefChip id={item.itemDef} />;
}
