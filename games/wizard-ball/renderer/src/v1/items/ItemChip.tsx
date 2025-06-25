import { itemData } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { clsx } from '@a-type/ui';
import { PerkEffect } from './PerkEffect';
import { TooltipPlus } from '../TooltipPlus';

export function ItemDefChip({ id }: { id: string }) {
  const itemDef = itemData[id];
  if (!itemDef) {
    return <span className="text-red-500">Unknown Item</span>;
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
      className="bg-gray-700 text-gray-100"
      content={
        <div className="flex flex-col gap-1">
          <span>{itemDef.description}</span>
          <PerkEffect effect={itemEffect} />
        </div>
      }
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
        {itemDef.icon} {itemName}
      </span>
    </TooltipPlus>
  );
}

export function ItemChip({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const item = finalState.league.itemLookup[id];
  if (!item) {
    return <span className="text-red-500">Unknown Item</span>;
  }
  return <ItemDefChip id={item.itemDef} />;
}
