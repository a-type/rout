import {
  FortressPiece,
  hexLayout,
} from '@long-game/game-heir-apparent-definition/v1';
import { Token } from '@long-game/game-ui';
import { deserializeCoordinate } from '@long-game/hex-map';
import { DomHexMap, DomHexTile } from '@long-game/hex-map/react';
import { hooks } from './gameClient.js';

export interface PlaceableFortressPieceProps {
  piece: FortressPiece;
}

export const PlaceableFortressPiece =
  hooks.withGame<PlaceableFortressPieceProps>(function FortressPiece({
    gameSuite,
    piece,
  }) {
    const coords = Object.keys(piece.tiles).map((c) =>
      deserializeCoordinate(c),
    );
    const qs = coords.map((c) => c[0]);
    const rs = coords.map((c) => c[1]);
    const dimensions = [
      Math.max(...qs) - Math.min(...qs) + 1,
      Math.max(...rs) - Math.min(...rs) + 1,
    ] as [number, number];
    return (
      <Token noHandle id={piece.id} data={piece}>
        <DomHexMap layout={hexLayout} dimensions={dimensions}>
          {Object.entries(piece.tiles).map(([sCoord, tile]) => (
            <DomHexTile.Root
              key={sCoord}
              coordinate={deserializeCoordinate(sCoord)}
            >
              {/* TODO: handles need metadata too, so we can offset
								the dropped piece based on which part was being grabbed
								and where it landed...
							*/}
              <Token.Handle>
                <DomHexTile.Shape
                  stroke="black"
                  strokeWidth={1}
                  coordinate={deserializeCoordinate(sCoord)}
                />
                <DomHexTile.Content>{tile.type[0]}</DomHexTile.Content>
              </Token.Handle>
            </DomHexTile.Root>
          ))}
        </DomHexMap>
      </Token>
    );
  });
