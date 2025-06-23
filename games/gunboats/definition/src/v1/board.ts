import { PrefixedId } from '@long-game/common';
import { ShipPartData } from './ships';

export type Position = { x: number; y: number };
export type SerializedPosition = `${number},${number}`;
export type BoardCell = {
  shipPart?: ShipPartData;
  placedShipPart?: ShipPartData;
  movedAway?: boolean;
  firedOn?: boolean;
};

// multiply by 90 degrees for rotation, beginning from right (0)
export type Orientation = 0 | 1 | 2 | 3;

export type Board = {
  cells: Record<SerializedPosition, BoardCell>;
  size: number;
};

export function serializePosition(position: Position): SerializedPosition {
  return `${position.x},${position.y}`;
}

export function deserializePosition(serialized: SerializedPosition) {
  const [x, y] = serialized.split(',').map(Number);
  return { x, y };
}

export function orientationToVector(orientation: Orientation): Position {
  switch (orientation) {
    case 0:
      return { x: 1, y: 0 }; // right
    case 1:
      return { x: 0, y: -1 }; // up
    case 2:
      return { x: -1, y: 0 }; // left
    case 3:
      return { x: 0, y: 1 }; // down
    default:
      throw new Error('Invalid orientation');
  }
}

export function getPlayerBoardView(board: Board, playerId: PrefixedId<'u'>) {
  return {
    ...board,
    cells: Object.fromEntries(
      Object.entries(board.cells).filter(([key, cell]) => {
        if (!cell.shipPart) return true;
        if (cell.shipPart.playerId === playerId) return true;
        return false;
      }),
    ),
  };
}

export function clearTemporaryBoardState(board: Board) {
  const newBoard: Board = { ...board, cells: {} };
  for (const [key, cell] of Object.entries(board.cells)) {
    const { placedShipPart, movedAway, firedOn, ...rest } = cell;
    newBoard.cells[key as SerializedPosition] = rest;
  }
  return newBoard;
}
