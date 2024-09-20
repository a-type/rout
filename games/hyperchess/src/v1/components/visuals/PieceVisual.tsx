import { colors, PlayerColorName } from '@long-game/common';
import { PieceType } from '../../gameDefinition.js';
import { King } from './King.js';
import { Queen } from './Queen.js';
import { Knight } from './Knight.js';
import { Bishop } from './Bishop.js';
import { Rook } from './Rook.js';
import { Pawn } from './Pawn.js';
import { useGrid } from '@long-game/game-ui';

export interface PieceVisualProps {
  type: PieceType;
  color: PlayerColorName;
}

const pieceVisuals = {
  king: King,
  queen: Queen,
  knight: Knight,
  bishop: Bishop,
  rook: Rook,
  pawn: Pawn,
};

export function PieceVisual({ type, color }: PieceVisualProps) {
  const colorValue = colors[color];
  const Visual = pieceVisuals[type];
  const { size: gridSize } = useGrid();

  return (
    <div
      style={{ color: colorValue.default, width: gridSize, height: gridSize }}
    >
      <Visual />
    </div>
  );
}
