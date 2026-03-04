import { getAdjacent, isWithinBoard, PlayerBoard } from './board';
import { isEmptyTile } from './tile';

// scoring a path - score increases more the longer you make it...
// but not too much (exponential)... for each additional tile, we add
// 1 more point than the previous tile, so 1 + 2 + 3 + ... n = n(n+1)/2
export function scorePath(path: PathDetails) {
  const n = path.cells.length;
  return (n * (n + 1)) / 2;
}

export function scoreBoard(board: PlayerBoard) {
  const paths = getDistinctPaths(board);
  // all complete and unbroken paths score points for the number of tiles.
  // no other paths score.
  let score = 0;
  for (const path of paths) {
    if (path.isComplete && !path.breaks.length) {
      score += scorePath(path);
    }
  }
  return score;
}

export interface PathDetails {
  id: string;
  cells: string[];
  isComplete: boolean;
  /** If the path is broken, this points to the tile which it 'collided' with */
  breaks: { cellKey: string; direction: 'up' | 'down' | 'left' | 'right' }[];
}

function makePathId(cellKeys: string[]) {
  return cellKeys.sort().join('.');
}

/**
 * Finds all groups of tiles which form connected 'roads'.
 * Paths can be complete, incomplete, or broken.
 * A complete path:
 * - Connects to the edge of the board at least once
 * - Has no loose ends
 * - Terminates only at the edge of the board or a terminator piece (a tile with only 1 directional connection)
 * An incomplete path:
 * - Has at least one loose end, no invalid loose ends: it can still be completed because
 *   all loose ends point toward an empty cell
 * A broken path:
 * - Has at least one invalid loose end, meaning a loose end that points toward an occupied cell which has
 *   no matching connection in that direction.
 */
export function getDistinctPaths(board: PlayerBoard): PathDetails[] {
  const paths = [] as PathDetails[];
  const visitedCells = new Set<string>();
  for (const cellKey in board) {
    if (visitedCells.has(cellKey)) continue;
    const cell = board[cellKey];
    if (cell.kind === 'tile') {
      if (isEmptyTile(cell.tile)) continue; // empty tiles don't form paths
      const path: Omit<PathDetails, 'id'> = {
        cells: [],
        isComplete: true, // easier to validate starting from assuming complete
        breaks: [],
      };
      const stack = [cellKey];
      while (stack.length > 0) {
        const currentCellKey = stack.pop()!;
        if (visitedCells.has(currentCellKey)) continue;
        visitedCells.add(currentCellKey);
        const currentCell = board[currentCellKey];
        if (currentCell.kind !== 'tile') continue; // should never happen since we only add tile cells to stack
        const { tile } = currentCell;
        path.cells.push(currentCellKey);
        for (const direction of ['up', 'down', 'left', 'right'] as const) {
          if (tile[direction]) {
            const adjacentKey = getAdjacent(currentCellKey, direction);
            const adjacentCell = board[adjacentKey];
            if (!adjacentCell) {
              // loose end, check if it's valid (points to empty cell) or invalid (points to occupied cell)
              if (isWithinBoard(adjacentKey)) {
                path.isComplete = false;
              }
            } else if (adjacentCell.kind === 'tile') {
              const oppositeDirection =
                direction === 'up'
                  ? 'down'
                  : direction === 'down'
                    ? 'up'
                    : direction === 'left'
                      ? 'right'
                      : 'left';
              if (adjacentCell.tile[oppositeDirection]) {
                stack.push(adjacentKey);
              } else {
                path.isComplete = false;
                path.breaks.push({
                  cellKey: adjacentKey,
                  direction: oppositeDirection,
                });
              }
            }
          }
        }
      }
      paths.push({
        id: makePathId(path.cells),
        ...path,
      });
    }
  }
  return paths;
}

export function pathsToLookup(paths: PathDetails[]) {
  const lookup: Record<string, PathDetails> = {};
  for (const path of paths) {
    for (const cellKey of path.cells) {
      lookup[cellKey] = path;
    }
  }
  return lookup;
}
