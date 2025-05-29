import { itemData } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { Tooltip } from '@a-type/ui';

export function ItemChip({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const item = finalState.league.itemLookup[id];
  const itemDef = itemData[item.itemDef];
  if (!itemDef) {
    return <span className="text-red-500">Unknown Item</span>;
  }
  const itemName = itemDef.name;
  return (
    <Tooltip
      className="bg-gray-700 text-gray-100"
      content={itemDef.description}
    >
      <span className="bg-gray-800 p-1 rounded cursor-pointer hover:bg-gray-700">
        +{item.power} {itemName} {itemDef.icon}
      </span>
    </Tooltip>
  );
}
