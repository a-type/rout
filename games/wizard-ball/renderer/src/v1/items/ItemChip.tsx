import { itemData } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { clsx, Tooltip } from '@a-type/ui';

export function ItemDefChip({ id }: { id: string }) {
  const itemDef = itemData[id];
  if (!itemDef) {
    return <span className="text-red-500">Unknown Item</span>;
  }
  const itemName = itemDef.name;
  const itemRarity = itemDef.rarity;
  const rarityColor = {
    common: '#9CA3AF',
    uncommon: '#34D399',
    rare: '#60A5FA',
    epic: '#A78BFA',
    legendary: '#FBBF24',
  }[itemRarity];
  return (
    <Tooltip
      className="bg-gray-700 text-gray-100"
      content={itemDef.description}
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
    </Tooltip>
  );
}

export function ItemChip({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const item = finalState.league.itemLookup[id];
  return <ItemDefChip id={item.itemDef} />;
}
