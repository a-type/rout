export type Tile =
  | '┼'
  | '┬'
  | '┴'
  | '┤'
  | '├'
  | '┌'
  | '┐'
  | '└'
  | '┘'
  | '│'
  | '─'
  | '·';

export type Coordinate = { x: number; y: number };

export const SORTED_TILES: Tile[] = [
  '·',
  '─',
  '│',
  '┌',
  '┐',
  '└',
  '┘',
  '├',
  '┤',
  '┬',
  '┴',
  '┼',
];

const MERGES_SOURCE: Partial<Record<Tile, Record<Tile, Tile>>> = {
  '·': {
    '·': '·',
    '─': '─',
    '│': '│',
    '┌': '┌',
    '┐': '┐',
    '└': '└',
    '┘': '┘',
    '┬': '┬',
    '┴': '┴',
    '├': '├',
    '┤': '┤',
    '┼': '┼',
  },
  '─': {
    '·': '─',
    '─': '─',
    '│': '┼',
    '┌': '┬',
    '┐': '┬',
    '└': '┴',
    '┘': '┴',
    '┬': '┬',
    '┴': '┴',
    '├': '┼',
    '┤': '┼',
    '┼': '┼',
  },
  '│': {
    '·': '│',
    '─': '┼',
    '│': '│',
    '┌': '├',
    '┐': '┤',
    '└': '├',
    '┘': '┤',
    '┬': '┼',
    '┴': '┼',
    '├': '├',
    '┤': '┤',
    '┼': '┼',
  },
  '┌': {
    '·': '┌',
    '─': '┬',
    '│': '├',
    '┌': '┌',
    '┐': '┼',
    '└': '├',
    '┘': '┼',
    '┬': '┬',
    '┴': '┼',
    '├': '├',
    '┤': '┼',
    '┼': '┼',
  },
  '┐': {
    '·': '┐',
    '─': '┬',
    '│': '┤',
    '┌': '┼',
    '┐': '┐',
    '└': '┼',
    '┘': '┤',
    '┬': '┬',
    '┴': '┼',
    '├': '┼',
    '┤': '┤',
    '┼': '┼',
  },
  '└': {
    '·': '└',
    '─': '┴',
    '│': '├',
    '┌': '├',
    '┐': '┼',
    '└': '└',
    '┘': '┼',
    '┬': '┼',
    '┴': '┴',
    '├': '├',
    '┤': '┼',
    '┼': '┼',
  },
};

/**
 * A map of how each tile merges with each other tile when overlaid.
 */
export const MERGES: Record<Tile, Record<Tile, Tile>> = (
  Object.keys(MERGES_SOURCE) as Tile[]
).reduce(
  (merges, a) => {
    // reflect merges_source across the diagonal to complete the matrix
    const row = MERGES_SOURCE[a]!;
    (Object.keys(row) as Tile[]).forEach((b) => {
      merges[a][b] = row[b];
      merges[b][a] = row[b];
    });
    return merges;
  },
  SORTED_TILES.reduce((merges, a) => {
    merges[a as Tile] = {} as any;
    return merges;
  }, {} as Record<Tile, Record<Tile, Tile>>),
);

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export const CONNECTIONS: Record<Tile, Record<Direction, boolean>> = {
  '·': {
    [Direction.UP]: false,
    [Direction.DOWN]: false,
    [Direction.LEFT]: false,
    [Direction.RIGHT]: false,
  },
  '─': {
    [Direction.UP]: false,
    [Direction.DOWN]: false,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: true,
  },
  '│': {
    [Direction.UP]: true,
    [Direction.DOWN]: true,
    [Direction.LEFT]: false,
    [Direction.RIGHT]: false,
  },
  '┌': {
    [Direction.UP]: false,
    [Direction.DOWN]: true,
    [Direction.LEFT]: false,
    [Direction.RIGHT]: true,
  },
  '┐': {
    [Direction.UP]: false,
    [Direction.DOWN]: true,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: false,
  },
  '└': {
    [Direction.UP]: true,
    [Direction.DOWN]: false,
    [Direction.LEFT]: false,
    [Direction.RIGHT]: true,
  },
  '┘': {
    [Direction.UP]: true,
    [Direction.DOWN]: false,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: false,
  },
  '├': {
    [Direction.UP]: true,
    [Direction.DOWN]: true,
    [Direction.LEFT]: false,
    [Direction.RIGHT]: true,
  },
  '┤': {
    [Direction.UP]: true,
    [Direction.DOWN]: true,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: false,
  },
  '┬': {
    [Direction.UP]: false,
    [Direction.DOWN]: true,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: true,
  },
  '┴': {
    [Direction.UP]: true,
    [Direction.DOWN]: false,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: true,
  },
  '┼': {
    [Direction.UP]: true,
    [Direction.DOWN]: true,
    [Direction.LEFT]: true,
    [Direction.RIGHT]: true,
  },
};

export const CONNECTION_COUNTS: Record<Tile, number> = Object.entries(
  CONNECTIONS,
).reduce((counts, [tile, connections]) => {
  counts[tile as Tile] = Object.values(connections).filter(Boolean).length;
  return counts;
}, {} as Record<Tile, number>);

function match(a: boolean, b: boolean) {
  return (a && b) || (!a && !b);
}

export function areTilesCompatible(
  a: Tile,
  aCoord: Coordinate,
  b: Tile,
  bCoord: Coordinate,
) {
  const aConnections = CONNECTIONS[a];
  const bConnections = CONNECTIONS[b];

  if (aCoord.x === bCoord.x) {
    if (aCoord.y === bCoord.y - 1) {
      return match(aConnections[Direction.DOWN], bConnections[Direction.UP]);
    } else if (aCoord.y === bCoord.y + 1) {
      return match(aConnections[Direction.UP], bConnections[Direction.DOWN]);
    }
  } else if (aCoord.y === bCoord.y) {
    if (aCoord.x === bCoord.x - 1) {
      return match(aConnections[Direction.RIGHT], bConnections[Direction.LEFT]);
    } else if (aCoord.x === bCoord.x + 1) {
      return match(aConnections[Direction.LEFT], bConnections[Direction.RIGHT]);
    }
  }

  return false;
}

/**
 * Gets the direction from one tile to an adjacent tile.
 * Throws an error if the tiles are not adjacent.
 */
export function getAdjacencyDirection(from: Coordinate, to: Coordinate) {
  if (from.x === to.x) {
    if (from.y === to.y - 1) {
      return Direction.DOWN;
    } else if (from.y === to.y + 1) {
      return Direction.UP;
    }
  } else if (from.y === to.y) {
    if (from.x === to.x - 1) {
      return Direction.RIGHT;
    } else if (from.x === to.x + 1) {
      return Direction.LEFT;
    }
  }
  throw new Error('Coordinates are not adjacent');
}
