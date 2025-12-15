import { hexLayout } from '@long-game/game-heir-apparent-definition/v1';
import { deserializeCoordinate } from '@long-game/hex-map';
import { SvgHexMap } from '@long-game/hex-map/react';
import { hooks } from './gameClient.js';
import { MapTile } from './MapTile.js';

export interface MapProps {}

export const Map = hooks.withGame<MapProps>(function Map({ gameSuite }) {
  const { mapSize, tiles } = gameSuite.finalState;
  return (
    <SvgHexMap
      dimensions={[mapSize * 2 - 1, mapSize * 2 - 1]}
      layout={hexLayout}
    >
      {Object.entries(tiles).map(([serializedCoord, tile]) => (
        <MapTile
          key={serializedCoord}
          coordinate={deserializeCoordinate(serializedCoord)}
          tile={tile}
        />
      ))}
    </SvgHexMap>
  );
});
