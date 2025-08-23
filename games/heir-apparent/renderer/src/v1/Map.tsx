import { hexLayout } from '@long-game/game-heir-apparent-definition/v1';
import { deserializeCoordinate } from '@long-game/hex-map';
import { HexMap } from '@long-game/hex-map/react';
import { hooks } from './gameClient.js';
import { MapTile } from './MapTile.js';

export interface MapProps {}

export const Map = hooks.withGame<MapProps>(function Map({ gameSuite }) {
  const { mapSize, tiles } = gameSuite.finalState;
  return (
    <HexMap
      renderer="dom"
      dimensions={[mapSize * 2, mapSize * 2]}
      layout={hexLayout}
    >
      {Object.entries(tiles).map(([serializedCoord, tile]) => (
        <MapTile
          key={serializedCoord}
          coordinate={deserializeCoordinate(serializedCoord)}
          tile={tile}
        />
      ))}
    </HexMap>
  );
});
