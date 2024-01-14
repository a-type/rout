import { CoordinateKey, Terrain } from '../gameDefinition.js';
import { axialToOffset, coordinateKeyToTuple } from '../utils.js';
import TerrainTile from './TerrainTile.js';

function TerrainGrid({
  items,
  playerLocation,
  playerColor,
  targetLocation,
  onClick,
}: {
  items: Record<CoordinateKey, Terrain>;
  playerLocation: CoordinateKey;
  targetLocation?: CoordinateKey;
  playerColor: string;
  onClick: (x: number, y: number) => void;
}) {
  const itemsToGrid = Object.entries(items).reduce((acc, [key, item]) => {
    const [x, y] = axialToOffset(coordinateKeyToTuple(key as CoordinateKey));

    return {
      ...acc,
      [x]: {
        ...acc[x],
        [y]: item,
      },
    };
  }, {} as Record<number, Record<number, Terrain>>);

  const [playerX, playerY] = playerLocation.split(',');

  return (
    <div className="flex flex-col">
      {Object.entries(itemsToGrid)
        .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
        .map(([x, row]) => (
          <div
            key={x}
            className="flex flex-row"
            style={{
              marginLeft: 22 * Math.abs(parseInt(x, 10)),
              marginTop: -4,
            }}
          >
            {Object.entries(row).map(([y, item]) => (
              <div key={y}>
                <TerrainTile
                  item={item}
                  hasPlayer={x === playerX && y === playerY}
                  playerColor={playerColor}
                  isTarget={targetLocation === `${x},${y}`}
                  onClick={() => onClick(parseInt(x), parseInt(y))}
                />
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

export default TerrainGrid;
