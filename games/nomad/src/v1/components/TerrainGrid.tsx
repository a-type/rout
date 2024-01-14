import { CoordinateKey, Terrain, TerrainType } from '../gameDefinition.js';

export const colorLookup: Record<TerrainType, string> = {
  desert: '#F6AE2D',
  forest: '#5B7553',
  mountain: '#2B303A',
  ocean: '#166088',
  grassland: '#82C09A',
  swamp: '#94778B',
  tundra: '#92DCE5',
};

function TerrainTile({
  item,
  hasPlayer,
  playerColor,
  onClick,
  isTarget,
}: {
  item: Terrain;
  hasPlayer: boolean;
  playerColor: string;
  onClick: () => void;
  isTarget: boolean;
}) {
  const color = colorLookup[item.type];
  const width = 50;
  const margin = 2;
  return (
    <>
      <div
        style={{
          position: 'relative',
          backgroundColor: isTarget ? 'red' : color,
          clipPath:
            'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
          margin,
          width,
          height: width * 1.1547,
          display: 'inline-block',
          marginBottom: margin - width * 0.2668,
        }}
        onClick={onClick}
      >
        {isTarget && (
          <div
            style={{
              position: 'absolute',
              backgroundColor: color,
              clipPath:
                'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
              margin: 4,
              top: 0,
              left: 0,
              width: width - 8,
              height: (width - 8) * 1.1547,
              display: 'inline-block',
            }}
            onClick={onClick}
          />
        )}
        {hasPlayer && (
          <div
            className="position-relative"
            style={{
              backgroundColor: playerColor,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 20,
            }}
          >
            P
          </div>
        )}
      </div>
    </>
  );
}

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
    const [x, y] = key.split(',');
    return {
      ...acc,
      [x]: {
        ...acc[x],
        [y]: item,
      },
    };
  }, {} as Record<string, Record<string, Terrain>>);
  const [playerX, playerY] = playerLocation.split(',');

  return (
    <div className="flex flex-col">
      {Object.entries(itemsToGrid).map(([x, row]) => (
        <div
          key={x}
          className="flex flex-row"
          style={{
            marginLeft: parseInt(x, 10) % 2 === 0 ? 0 : 26,
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
