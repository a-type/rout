import { PrefixedId } from '@long-game/common';
import type { Coordinate, GridCell } from './gameDefinition.js';

export type Territory = {
  playerId: PrefixedId<'u'>;
  cells: Coordinate[];
  totalPower: number;
};

export const getContiguousTerritories = (
  grid: GridCell[][],
  x: number,
  y: number,
) => {
  const territories: Territory[] = [];
  const visited = Array.from({ length: grid.length }, () =>
    Array.from({ length: grid[0].length }, () => false),
  );
  const queue: Coordinate[] = getAdjacents({ x, y }, grid.length);
  while (queue.length > 0) {
    const { x, y } = queue.pop()!;

    if (x >= grid[0].length || x < 0 || y >= grid.length || y < 0) {
      continue;
    }

    if (visited[y][x]) {
      continue;
    }

    const territory = discoverWholeTerritory(grid, x, y, visited);
    if (territory) {
      territories.push(territory);
    }
  }
  return territories;
};

/**
 * Starting with a claimed cell, find all contiguous cells that belong to the same player.
 * Returns the full territory. Visited cells are added to the visited array.
 */
function discoverWholeTerritory(
  grid: GridCell[][],
  x: number,
  y: number,
  visited: boolean[][],
  territory?: Territory,
) {
  if (x >= grid[0].length || x < 0 || y >= grid.length || y < 0) {
    return null;
  }

  if (visited[y][x]) {
    return null;
  }
  const cell = grid[y][x];
  if (!cell.playerId || (territory && cell.playerId !== territory.playerId)) {
    return null;
  }

  visited[y][x] = true;
  if (!territory) {
    territory = {
      playerId: cell.playerId,
      cells: [],
      totalPower: 0,
    };
  }

  territory.cells.push({ x, y });
  territory.totalPower += cell.power;

  getAdjacents({ x, y }, grid.length).forEach((coord) =>
    discoverWholeTerritory(grid, coord.x, coord.y, visited, territory),
  );

  return territory;
}

/**
 * Finds every territory on the grid
 */
export const getAllTerritories = (grid: GridCell[][]) => {
  const territories: Territory[] = [];
  const visited = Array.from({ length: grid.length }, () =>
    Array.from({ length: grid[0].length }, () => false),
  );
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (visited[y][x]) {
        continue;
      }
      const territory = discoverWholeTerritory(grid, x, y, visited);
      if (territory) {
        territories.push(territory);
      }
    }
  }

  return territories;
};

export const getAdjacents = (
  coord: { x: number; y: number },
  gridSize: number,
) => {
  const adjacents = [];
  if (coord.x > 0) {
    adjacents.push({ x: coord.x - 1, y: coord.y });
  }
  if (coord.x < gridSize - 1) {
    adjacents.push({ x: coord.x + 1, y: coord.y });
  }
  if (coord.y > 0) {
    adjacents.push({ x: coord.x, y: coord.y - 1 });
  }
  if (coord.y < gridSize - 1) {
    adjacents.push({ x: coord.x, y: coord.y + 1 });
  }
  return adjacents;
};

export const getUnclaimedCells = (grid: GridCell[][]) => {
  const unclaimed: Coordinate[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!grid[y][x].playerId) {
        unclaimed.push({ x, y });
      }
    }
  }
  return unclaimed;
};

export const getFlatCoordinates = (grid: GridCell[][]) => {
  const flat: Coordinate[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      flat.push({ x, y });
    }
  }
  return flat;
};

export function getCoordinateKey({ x, y }: Coordinate) {
  return `${x},${y}`;
}

export function getOwner(grid: GridCell[][], coordinate: Coordinate) {
  return grid[coordinate.y][coordinate.x].playerId;
}

export function canPlayCell(
  grid: GridCell[][],
  coordinate: Coordinate,
  playerId: string,
) {
  const owner = getOwner(grid, coordinate);
  return !owner || owner === playerId;
}

/**
 * Grades each cell by 'containment' within the territory.
 * Boundary cells are rated lower, cells with more neighbors are rated higher,
 * and cells which are interior to other cells are rated highest.
 *
 * This is done by taking each cell and counting the minimum number of
 * cells that must be traversed to reach the boundary of the territory.
 */
export function getInnermostCell(territory: Pick<Territory, 'cells'>) {
  let innermostCell: Coordinate | null = null;
  let innermostDistance = 0;
  for (const cell of territory.cells) {
    const distance = getDistanceToBoundary(cell, territory.cells);
    if (distance > innermostDistance) {
      innermostDistance = distance;
      innermostCell = cell;
    }
  }
  return innermostCell;
}

/**
 * Returns the minimum number of cells that must be traversed to reach the boundary
 * of the territory from the given cell.
 */
function getDistanceToBoundary(cell: Coordinate, territory: Coordinate[]) {
  let posXDistance = 0;
  let posYDistance = 0;
  let negXDistance = 0;
  let negYDistance = 0;

  let x = cell.x;
  while (territory.some((c) => c.x === x)) {
    posXDistance++;
    x++;
  }
  x = cell.x;
  while (territory.some((c) => c.x === x)) {
    negXDistance++;
    x--;
  }

  let y = cell.y;
  while (territory.some((c) => c.y === y)) {
    posYDistance++;
    y++;
  }
  y = cell.y;
  while (territory.some((c) => c.y === y)) {
    negYDistance++;
    y--;
  }

  return Math.min(posXDistance, negXDistance, posYDistance, negYDistance);
}

export function hasCoordinate(list: Coordinate[], coord: Coordinate) {
  return list.some((c) => c.x === coord.x && c.y === coord.y);
}

export function withoutCoordinate(list: Coordinate[], coord: Coordinate) {
  return list.filter((c) => c.x !== coord.x || c.y !== coord.y);
}
