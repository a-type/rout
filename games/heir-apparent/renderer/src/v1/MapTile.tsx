import {
  FortressPiece,
  GameMapTileData,
  isFortressPiece,
  isUnitData,
  TurnData,
  UnitData,
} from '@long-game/game-heir-apparent-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { HexCoordinate, serializeCoordinate } from '@long-game/hex-map';
import { DomHexTile, DomHexTileShape } from '@long-game/hex-map/react';
import { hooks } from './gameClient.js';
import { tileColors } from './tileGraphics.js';

export interface MapTileProps {
  coordinate: HexCoordinate;
  tile: GameMapTileData;
}

export const MapTile = hooks.withGame<MapTileProps>(function MapTile({
  gameSuite,
  coordinate,
  tile,
}) {
  function placeUnit(cur: TurnData, unit: UnitData) {
    cur.unitActions[unit.id] ??= [];
    cur.unitActions[unit.id].push({
      action: 'move',
      target: coordinate,
    });
    return cur;
  }
  function placePiece(cur: TurnData, piece: FortressPiece) {
    cur.piecePlacement = {
      origin: coordinate,
      pieceId: piece.id,
      rotation: 0,
    };
    return cur;
  }

  return (
    <DomHexTile
      coordinate={coordinate}
      strokeWidth={1}
      stroke="var(--color-gray-dark)"
      fill="var(--color-primary-light)"
      style={
        {
          '--dyn-primary-source': tileColors[tile.terrain.type],
        } as any
      }
      className="theme"
    >
      <TokenSpace<FortressPiece | UnitData>
        id={serializeCoordinate(coordinate)}
        className="w-full h-full"
        accept={({ data }) => {
          if (!isUnitData(data) && !isFortressPiece(data)) {
            return 'Cannot drop that here';
          }
          let err: string | undefined;
          if (isUnitData(data)) {
            err = gameSuite.validatePartialTurn((cur) =>
              placeUnit(cur, data),
            )?.message;
          } else if (isFortressPiece(data)) {
            err = gameSuite.validatePartialTurn((cur) =>
              placePiece(cur, data),
            )?.message;
          }
          if (err) {
            return err;
          }
          return true;
        }}
        onDrop={({ data }) => {
          if (isUnitData(data)) {
            gameSuite.prepareTurn((cur) => placeUnit(cur, data));
          } else {
            gameSuite.prepareTurn((cur) => placePiece(cur, data));
          }
        }}
      >
        {tile.terrain.type[0]}
        {tile.fortress && (
          <DomHexTileShape
            coordinate={coordinate}
            className="fill-gray center"
          />
        )}
      </TokenSpace>
    </DomHexTile>
  );
});
