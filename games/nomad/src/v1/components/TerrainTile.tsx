import { CoordinateKey, Terrain } from '../gameDefinition.js';
import colorLookup from './terrainColors.js';
import Mountains from './icons/Mountains.js';
import Swamp from './icons/Swamp.js';
import TileIcon from './TileIcon.js';
import Meeple from './icons/Meeple.js';

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
  const width = 40;
  const margin = 2;
  return (
    <>
      <div
        className="position-relative inline-block"
        style={{
          backgroundColor: isTarget ? 'red' : color,
          clipPath:
            'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
          margin,
          width,
          height: width * 1.1547,
          marginBottom: margin - width * 0.2668,
        }}
        onClick={onClick}
      >
        {isTarget && (
          <div
            className="position-absolute pointer-events-none inline-block"
            style={{
              backgroundColor: color,
              clipPath:
                'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
              margin: 4,
              top: 0,
              left: 0,
              width: width - 8,
              height: (width - 8) * 1.1547,
            }}
          />
        )}
        <TileIcon
          type={item.type}
          className="position-absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ top: '50%', left: '50%', width: 30 }}
        />
        {item.features.map((feature, idx) => (
          <TileIcon
            type={feature}
            key={idx}
            className="position-absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ top: '50%', left: '50%', width: 30 }}
          />
        ))}
        {hasPlayer && (
          <Meeple
            className="position-relative transform -translate-x-1/2 -translate-y-1/2"
            style={{
              color: playerColor,
              top: '50%',
              left: '50%',
              width: 30,
              height: 30,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </>
  );
}
export default TerrainTile;
