import { hexLayout } from '@long-game/game-heir-apparent-definition/v1';
import { deserializeCoordinate } from '@long-game/hex-map';
import { HexMap, HexTile } from '@long-game/hex-map/react';
import { hooks } from './gameClient.js';

export interface MapProps {}

export const Map = hooks.withGame<MapProps>(function Map({ gameSuite }) {
  const { mapSize, tiles } = gameSuite.finalState;
  return (
    <HexMap dimensions={[mapSize, mapSize]} layout={hexLayout}>
      {Object.entries(tiles).map(([serializedCoord, tile]) => (
        <HexTile
          key={serializedCoord}
          coordinate={deserializeCoordinate(serializedCoord)}
        >
          {tile.type[0]}
        </HexTile>
      ))}
    </HexMap>
  );
});
