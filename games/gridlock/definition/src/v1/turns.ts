import { boardSize, Placement, PlayerBoard } from './board';
import { Tile } from './tile';

export const handSize = 5;
export const playedTiles = 2;
export const turnsInGame = (boardSize * boardSize) / playedTiles;

export function applyPlacement({
  board,
  placement,
  tileId,
  hand,
}: {
  board: PlayerBoard;
  placement: Placement;
  tileId: string;
  hand: Tile[];
}) {
  const tile = hand.find((tile) => tile.id === tileId);
  if (!tile) {
    throw new Error(
      `Placement error: Tile ${tileId} not found in hand. Not validated correctly?`,
    );
  }
  board[placement.cellKey] = {
    kind: 'tile',
    tile,
  };
  hand.splice(
    hand.findIndex((t) => t.id === tileId),
    1,
  );
}
