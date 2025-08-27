import { Box } from '@a-type/ui';
import {
  FortressPiece,
  hexLayout,
} from '@long-game/game-heir-apparent-definition/v1';
import { Token, useIsDragPreview } from '@long-game/game-ui';
import { deserializeCoordinate } from '@long-game/hex-map';
import { DomHexMap, DomHexTile } from '@long-game/hex-map/react';
import { motion } from 'motion/react';
import { hooks } from './gameClient.js';
import { tileColors } from './tileGraphics.js';
import { zoomGlobal } from './viewportGlobals.js';

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

  const content = (
    <DomHexMap
      layout={hexLayout}
      dimensions={dimensions}
      className="drop-shadow-lg"
    >
      {Object.entries(piece.tiles).map(([sCoord, tile]) => (
        <DomHexTile
          key={sCoord}
          coordinate={deserializeCoordinate(sCoord)}
          strokeWidth={1}
          stroke="var(--color-gray-dark)"
          fill="var(--color-primary-light)"
          style={
            {
              '--dyn-primary-source': tileColors[tile.type],
            } as any
          }
          className="theme"
        >
          {tile.type[0]}
        </DomHexTile>
      ))}
    </DomHexMap>
  );

  if (isDragging) {
    return (
      <motion.div style={{ scale: zoomGlobal, zIndex: 100 }}>
        {content}
      </motion.div>
    );
  }

  return (
    <Box surface p border>
      {content}
    </Box>
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
