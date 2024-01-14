import { CoordinateKey, Terrain } from '../gameDefinition.js';
import { axialToOffset, coordinateKeyToTuple } from '../utils.js';
import TerrainTile from './TerrainTile.js';

function TerrainGrid({
  items,
  playerLocation,
  playerColor,
  movePath,
  onClick,
}: {
  items: Record<CoordinateKey, Terrain>;
  playerLocation: CoordinateKey;
  movePath?: Array<CoordinateKey>;
  playerColor: string;
  onClick: (x: number, y: number) => void;
}) {
  const itemsToGrid = Object.entries(items).reduce((acc, [key, item]) => {
    const [x, y] = axialToOffset(coordinateKeyToTuple(key as CoordinateKey));

    return {
      ...acc,
      [x]: {
        ...acc[x],
        [y]: { item, coordinates: key as CoordinateKey },
      },
    };
  }, {} as Record<number, Record<number, { item: Terrain; coordinates: CoordinateKey }>>);

  const [playerX, playerY] = coordinateKeyToTuple(playerLocation);

  return (
    <div className="flex flex-col mb2">
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
            {Object.entries(row)
              .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
              .map(([y, { item, coordinates }]) => (
                <div key={y}>
                  <TerrainTile
                    item={item}
                    hasPlayer={coordinates === playerLocation}
                    playerColor={playerColor}
                    isTarget={!!movePath?.includes(coordinates)}
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
