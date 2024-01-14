import { Terrain } from '../gameDefinition.js';
import { movementCosts } from './terrain.js';

function TileInfo({ item }: { item: Terrain }) {
  return (
    <div className="flex flex-col">
      <h3 className="capitalize">{item.type}</h3>
      <div>Move cost: {movementCosts[item.type]}</div>
    </div>
  );
}

export default TileInfo;
