import { ItemId, itemDefinitions } from '../items.js';
import Card from './Card.js';

function Inventory({ itemIds }: { itemIds: ItemId[] }) {
  return (
    <div className="flex flex-row gap-2">
      {itemIds.map((eventId, idx) => {
        const itemDef = itemDefinitions[eventId];
        return <Card key={idx} {...itemDef} />;
      })}
    </div>
  );
}

export default Inventory;
