import { Terrain } from '../gameDefinition.js';
import { movementCosts } from './terrain.js';

function TileInfo({ item }: { item: Terrain }) {
  return (
    <div className="flex flex-col">
      <h2 className="capitalize">{item.type}</h2>
      <div>Move cost: {movementCosts[item.type]}</div>
      {item.features.length > 0 && (
        <div>
          <h3>Features</h3>
          {item.features.map((feature, idx) => (
            <div key={idx} className="capitalize">
              {feature}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TileInfo;
