import { PROPS } from '@a-type/ui';
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
import { SvgHexTile } from '@long-game/hex-map/react';
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
    <TokenSpace<FortressPiece | UnitData>
      svg
      id={serializeCoordinate(coordinate)}
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
      render={
        <SvgHexTile.Root
          coordinate={coordinate}
          strokeWidth={1}
          style={
            {
              [PROPS.USER.COLOR.PRIMARY_HUE]: tileColors[tile.terrain.type],
            } as any
          }
          className="theme"
        />
      }
    >
      <SvgHexTile.Shape
        coordinate={coordinate}
        className="center stroke-gray-dark fill-primary-light"
      />
      <SvgHexTile.Content coordinate={coordinate} className="center">
        <text>{tile.terrain.type[0]}</text>
      </SvgHexTile.Content>
      {tile.fortress && (
        <>
          <SvgHexTile.Shape
            coordinate={coordinate}
            className="fill-gray center"
          />
          <SvgHexTile.Content coordinate={coordinate} className="center">
            <text>{tile.fortress.type[0]}</text>
          </SvgHexTile.Content>
        </>
      )}
    </TokenSpace>
  );
});
