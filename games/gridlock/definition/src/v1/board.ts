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
