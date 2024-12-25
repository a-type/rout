import type { Coordinate, GridCell } from './gameDefinition.js';

export type Territory = {
  playerId: string;
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
  visited[y][x] = true;
  const cell = grid[y][x];
  if (!cell.playerId || (territory && cell.playerId !== territory.playerId)) {
    return null;
  }

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
  const cellToTerritoryMap: Record<string, Territory> = {};
  const visited = Array.from({ length: grid.length }, () =>
    Array.from({ length: grid[0].length }, () => false),
  );
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (!cell.playerId) {
        continue;
      }
      // check all adjacent cells for territories that match the
      // player, if so add it to that territory
      let assigned = false;
      const adjacents = getAdjacents({ x, y }, grid.length);
      for (const adjacent of adjacents) {
        const adjacentCell = grid[adjacent.y][adjacent.x];
        if (
          adjacentCell.playerId === cell.playerId &&
          cellToTerritoryMap[getCoordinateKey(adjacent)]
        ) {
          const territory = cellToTerritoryMap[getCoordinateKey(adjacent)];
          territory.cells.push({ x, y });
          territory.totalPower += cell.power;
          cellToTerritoryMap[getCoordinateKey({ x, y })] = territory;
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        const territory = {
          playerId: cell.playerId,
          cells: [{ x, y }],
          totalPower: cell.power,
        };
        territories.push(territory);
        cellToTerritoryMap[getCoordinateKey({ x, y })] = territory;
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

export function getCoordinateKey({ x, y }: Coordinate) {
  return `${x},${y}`;
}
