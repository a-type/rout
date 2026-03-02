import {
  boardSize,
  getAllAdjacents,
  getOppositeDirection,
  isWithinBoard,
  Placement,
  PlayerBoard,
} from './board';
import { GlobalState } from './gameDefinition';
import { isEmptyTile, isTerminatorTile, Tile } from './tile';

export const handSize = 5;
export const playedTiles = handSize;
export const turnsInGame = (boardSize * boardSize) / playedTiles;

export function getRoundHand({
  globalState,
  roundIndex,
}: {
  globalState: GlobalState;
  roundIndex: number;
}) {
  return globalState.drawPile.slice(
    roundIndex * handSize,
    roundIndex * handSize + handSize,
  );
}

/**
 * MUTATES BOARD AND HAND!
 */
export function applyPlacement({
  board,
  placement,
  hand,
}: {
  board: PlayerBoard;
  placement: Placement;
  hand: Tile[];
}) {
  const tile = hand.find((tile) => tile.id === placement.tileId);
  if (!tile) {
    throw new Error(
      `Placement error: Tile ${placement.tileId} not found in hand. Not validated correctly?`,
    );
  }
  board[placement.cellKey] = {
    kind: 'tile',
    tile,
  };
  hand.splice(
    hand.findIndex((t) => t.id === placement.tileId),
    1,
  );
}

export function withPlacement({
  board,
  placement,
  hand,
}: {
  board: PlayerBoard;
  placement: Placement;
  hand: Tile[];
}): { board: PlayerBoard; hand: Tile[] } {
  const tile = hand.find((t) => t.id === placement.tileId);
  if (!tile) {
    throw new Error(
      `Placement error: Tile ${placement.tileId} not found in hand. Not validated correctly?`,
    );
  }
  return {
    board: {
      ...board,
      [placement.cellKey]: {
        kind: 'tile',
        tile,
      },
    },
    hand: hand.filter((t) => t.id !== placement.tileId),
  };
}

/**
 * Validates that all placements have a path through existing cells
 * or new placements to reach the edge of the board.
 * Returns the first invalid placement if any, otherwise void.
 *
 * A valid path means the adjacent cell's connection matches
 * the tile's connection. Meeting the edge means the tile has at least
 * one connection pointed to the edge of the board.
 */
export function validatePathToTermination({
  board,
  placements,
  hand,
}: {
  board: PlayerBoard;
  placements: Placement[];
  hand: Tile[];
}): Placement | void {
  // if we connect to a cell already validated as having a path to edge, we can skip validating that cell's path again
  const visitedValidCells = new Set<string>();
  // pathfind from each placement to edge, only through existing cells or placements
  for (const placement of placements) {
    // special case: empty tile can be placed anywhere since it has no connections
    const tile = hand.find((t) => t.id === placement.tileId)!;
    if (isEmptyTile(tile)) {
      continue;
    }

    // special case: terminator tiles can be placed anywhere
    if (isTerminatorTile(tile)) {
      continue;
    }

    const stack = [placement.cellKey];
    const visitedCells = new Set<string>();
    let hasPathToEdge = false;
    while (stack.length > 0) {
      const cellKey = stack.pop()!;
      if (visitedCells.has(cellKey)) continue;
      visitedCells.add(cellKey);
      if (visitedValidCells.has(cellKey)) {
        hasPathToEdge = true;
        break;
      }
      const cell = board[cellKey];
      const placementAtCell = placements.find((p) => p.cellKey === cellKey);
      if (!cell && !placementAtCell) continue; // should never happen since we only add cells to stack if they are in board or placements
      const tile = placementAtCell
        ? hand.find((t) => t.id === placementAtCell.tileId)!
        : cell!.tile;

      // if this tile is a teminator, it terminates itself.
      if (isTerminatorTile(tile)) {
        hasPathToEdge = true;
        break;
      }

      const adjacents = getAllAdjacents(cellKey);
      for (const direction of ['up', 'down', 'left', 'right'] as const) {
        if (tile[direction]) {
          const adjacentKey = adjacents[direction];
          if (!isWithinBoard(adjacentKey)) {
            hasPathToEdge = true;
            break;
          }
          const adjacentCell = board[adjacentKey];
          const adjacentPlacement = placements.find(
            (p) => p.cellKey === adjacentKey,
          );
          if (adjacentCell) {
            if (adjacentCell.kind !== 'tile') continue; // should never happen since we only add cells to stack if they are in board or placements
            const oppositeDirection = getOppositeDirection(direction);
            if (adjacentCell.tile[oppositeDirection]) {
              stack.push(adjacentKey);
            }
          } else if (adjacentPlacement) {
            const oppositeDirection = getOppositeDirection(direction);
            const adjacentTile = hand.find(
              (t) => t.id === adjacentPlacement.tileId,
            )!;
            if (adjacentTile[oppositeDirection]) {
              stack.push(adjacentKey);
            }
          }
        }
      }
      if (hasPathToEdge) {
        for (const visited of visitedCells) {
          visitedValidCells.add(visited);
        }
        break;
      }
    }
    if (!hasPathToEdge) {
      return placement;
    }
  }
}

export function isValidPlacement({
  board,
  newPlacement: placement,
  hand,
}: {
  board: PlayerBoard;
  newPlacement: Placement;
  hand: Tile[];
}): boolean {
  return !validatePathToTermination({
    board,
    placements: [placement],
    hand,
  });
}

export function hasAnyValidPlacement({
  board,
  tile,
}: {
  board: PlayerBoard;
  tile: Tile;
}): boolean {
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      const cellKey = `${x},${y}`;
      if (board[cellKey]) continue; // can't place on occupied cell
      const placement: Placement = { cellKey, tileId: tile.id };
      if (isValidPlacement({ board, newPlacement: placement, hand: [tile] })) {
        return true;
      }
    }
  }
  return false;
}
