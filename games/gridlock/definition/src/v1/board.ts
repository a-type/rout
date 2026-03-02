import { Tile } from './tile';

export interface PlayerBoard {
  [cellKey: string]: PlayerBoardCell;
}

export type PlayerBoardCell = {
  kind: 'tile';
  tile: Tile;
};

export interface Placement {
  tileId: string;
  cellKey: string;
}

export function toCellKey(x: number, y: number) {
  return `${x},${y}`;
}

export function fromCellKey(cellKey: string) {
  const [x, y] = cellKey.split(',').map(Number);
  return { x, y };
}

export const boardSize = 8;

export function getAdjacent(
  cellKey: string,
  direction: 'up' | 'down' | 'left' | 'right',
) {
  const { x, y } = fromCellKey(cellKey);
  switch (direction) {
    case 'up':
      return toCellKey(x, y - 1);
    case 'down':
      return toCellKey(x, y + 1);
    case 'left':
      return toCellKey(x - 1, y);
    case 'right':
      return toCellKey(x + 1, y);
  }
}

export function getOppositeDirection(
  direction: 'up' | 'down' | 'left' | 'right',
) {
  switch (direction) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

export function getAllAdjacents(cellKey: string) {
  return {
    up: getAdjacent(cellKey, 'up'),
    down: getAdjacent(cellKey, 'down'),
    left: getAdjacent(cellKey, 'left'),
    right: getAdjacent(cellKey, 'right'),
  };
}

export function isWithinBoard(cellKey: string) {
  const { x, y } = fromCellKey(cellKey);
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}
