import {
  FortressPiece,
  hexLayout,
} from '@long-game/game-heir-apparent-definition/v1';
import { Token, useIsDragPreview } from '@long-game/game-ui';
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
    return (
      <Token id={piece.id} data={piece}>
        <Content piece={piece} />
      </Token>
    );
  });

function Content({ piece }: { piece: FortressPiece }) {
  const dimensions = usePieceMapDimensions(piece);
  const isDragging = useIsDragPreview();

  return (
    <DomHexMap layout={hexLayout} dimensions={dimensions}>
      {Object.entries(piece.tiles).map(([sCoord, tile]) => (
        <DomHexTile
          key={sCoord}
          coordinate={deserializeCoordinate(sCoord)}
          stroke="black"
          strokeWidth={1}
        >
          {tile.type[0]}
        </DomHexTile>
      ))}
    </DomHexMap>
  );
}

function usePieceMapDimensions(piece: FortressPiece) {
  const coords = Object.keys(piece.tiles).map((c) => deserializeCoordinate(c));
  const qs = coords.map((c) => c[0]);
  const rs = coords.map((c) => c[1]);
  const dimensions = [
    Math.max(...qs) - Math.min(...qs) + 1,
    Math.max(...rs) - Math.min(...rs) + 1,
  ] as [number, number];
  return dimensions;
}
