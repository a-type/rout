export type TileShape =
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

export const SORTED_TILES: TileShape[] = [
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

const MERGES_SOURCE: Partial<Record<TileShape, Record<TileShape, TileShape>>> =
  {
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
export const MERGES: Record<TileShape, Record<TileShape, TileShape>> = (
  Object.keys(MERGES_SOURCE) as TileShape[]
).reduce(
  (merges, a) => {
    // reflect merges_source across the diagonal to complete the matrix
    const row = MERGES_SOURCE[a]!;
    (Object.keys(row) as TileShape[]).forEach((b) => {
      merges[a][b] = row[b];
      merges[b][a] = row[b];
    });
    return merges;
  },
  SORTED_TILES.reduce((merges, a) => {
    merges[a as TileShape] = {} as any;
    return merges;
  }, {} as Record<TileShape, Record<TileShape, TileShape>>),
);

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export const CONNECTIONS: Record<TileShape, Record<Direction, boolean>> = {
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

export const CONNECTION_COUNTS: Record<TileShape, number> = Object.entries(
  CONNECTIONS,
).reduce((counts, [tile, connections]) => {
  counts[tile as TileShape] = Object.values(connections).filter(Boolean).length;
  return counts;
}, {} as Record<TileShape, number>);

function match(a: boolean, b: boolean) {
  return (a && b) || (!a && !b);
}

export function areTilesCompatible(
  a: TileShape,
  aCoord: Coordinate,
  b: TileShape,
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

export type CoordinateKey = `${number},${number}`;

export function toCoordinateKey(x: number, y: number): CoordinateKey {
  return `${x},${y}`;
}

export function fromCoordinateKey(key: CoordinateKey) {
  const [x, y] = key.split(',');
  return { x: Number(x), y: Number(y) };
}

export function isCoordinateKey(key: string): key is CoordinateKey {
  return /^\d+,\d+$/.test(key);
}

export function mergeTiles(tiles: TileShape[]) {
  return tiles.reduce((merged, tile) => {
    const [a, b] = [merged, tile].sort();
    return MERGES[a][b];
  }, '·');
}
