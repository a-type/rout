import { TileData } from '@long-game/game-heir-apparent-definition/v1';
import { HexCoordinate } from '@long-game/hex-map';
import { DomHexTile } from '@long-game/hex-map/react';
import { hooks } from './gameClient.js';

export interface MapTileProps {
  coordinate: HexCoordinate;
  tile: TileData;
}

export const MapTile = hooks.withGame<MapTileProps>(function MapTile({
  gameSuite,
  coordinate,
  tile,
}) {
  return (
    <DomHexTile
      coordinate={coordinate}
      strokeWidth={1}
      stroke="var(--color-gray-dark)"
    >
      {tile.type[0]}
    </DomHexTile>
  );
});
