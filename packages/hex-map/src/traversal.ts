import {
  addCoordinates,
  coordinateDistance,
  fromQS,
  fromRS,
  getDirection,
  getNeighbor,
  HexCoordinate,
  lerpCoordinates,
  multiplyCoordinate,
} from './coordinates.js';
import { serializeCoordinate, SerializedCoordinate } from './maps.js';
import { HexLayoutContext, roundFractionalCoordinate } from './rendering.js';

export type HexTraverser = () => Generator<HexCoordinate | null, any, any>;

export function traverseMap(
  traverser: HexTraverser,
  visitor: (coordinate: HexCoordinate, index: number) => void,
) {
  let index = 0;
  for (const coordinate of traverser()) {
    if (coordinate) {
      visitor(coordinate, index);
      index++;
    }
  }
}

export function collectTraversals(traverser: HexTraverser) {
  const traversals: HexCoordinate[] = [];
  traverseMap(traverser, (coord) => traversals.push(coord));
  return traversals;
}

export function diamondTraverser(
  ctx: HexLayoutContext,
  /** The "radius" of the diamond. Must be an integer. */
  size: number,
): HexTraverser {
  const origin = ctx.origin || [0, 0];
  size = Math.floor(size);
  return function* () {
    for (let i = -size; i <= size; i++) {
      for (let j = -size; j <= size; j++) {
        if (ctx.orientation === 'pointy') {
          // pointy iterators: S, Q
          yield addCoordinates(origin, fromQS(j, i));
        } else {
          // flat iterators: R, S
          yield addCoordinates(origin, fromRS(i, j));
        }
      }
    }
  };
}

/**
 * Starts at a corner (origin) and builds a triangle outward.
 * "Direction" is roughly "forward" or "backward" and depends
 * on the layout orientation (pointy/flat).
 */
export function triangleTraverser(
  ctx: HexLayoutContext,
  /** The size of one side of the triangle */
  size: number,
  direction: 0 | 1,
): HexTraverser {
  size = Math.floor(size);
  const origin = ctx.origin || [0, 0];
  return function* () {
    for (let q = 0; q < size; q++) {
      const j0 = direction === 0 ? 0 : size - q;
      const j1 = direction === 0 ? size - q : size;
      for (let r = j0; r < j1; r++) {
        yield addCoordinates(origin, [q, r]);
      }
    }
  };
}

export function hexagonTraverser(
  ctx: HexLayoutContext,
  /** The "radius" of the hexagon around the origin. Must be an integer */
  size: number,
): HexTraverser {
  size = Math.floor(size);
  const origin = ctx.origin || [0, 0];
  return function* () {
    for (let q = -size; q <= size; q++) {
      const r1 = Math.max(-size, -q - size);
      const r2 = Math.min(size, -q + size);
      for (let r = r1; r <= r2; r++) {
        yield addCoordinates(origin, [q, r]);
      }
    }
  };
}

export function rectangleTraverser(
  ctx: HexLayoutContext,
  /** Size of the horizontal side, including origin */
  width: number,
  /** Size of the vertical side, including origin */
  height: number,
): HexTraverser {
  const origin = ctx.origin || [0, 0];
  if (ctx.orientation === 'pointy') {
    return function* () {
      for (let r = 0; r < height; r++) {
        const rOffset = Math.floor(r / 2);
        for (let q = -rOffset; q < width - rOffset; q++) {
          yield addCoordinates(origin, [q, r]);
        }
      }
    };
  } else {
    return function* () {
      for (let q = 0; q <= width; q++) {
        const qOffset = Math.floor(q / 2);
        for (let r = -qOffset; r <= height - qOffset; r++) {
          yield addCoordinates(origin, [q, r]);
        }
      }
    };
  }
}

export function lineTraverser(
  start: HexCoordinate,
  end: HexCoordinate,
): HexTraverser {
  const distance = coordinateDistance(start, end);
  // prevents irregular rounding on edges
  const startNudged: HexCoordinate = [start[0] + 1e-6, start[1] + 1e-6];
  const endNudged: HexCoordinate = [end[0] + 1e-6, end[1] + 1e-6];
  const step = 1 / Math.max(1, distance);
  return function* () {
    for (let i = 0; i <= distance; i++) {
      yield roundFractionalCoordinate(
        lerpCoordinates(startNudged, endNudged, step * i),
      );
    }
  };
}

// https://www.redblobgames.com/grids/hexagons/#rings-single
export function ringTraverser(
  ctx: HexLayoutContext,
  radius: number,
): HexTraverser {
  const origin = ctx.origin || [0, 0];
  return function* () {
    if (radius === 0) {
      yield origin;
      return;
    }
    let current = addCoordinates(
      origin,
      multiplyCoordinate(getDirection(4), radius),
    );
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < radius; j++) {
        yield current;
        current = getNeighbor(current, i);
      }
    }
  };
}

export function spiralTraverser(
  ctx: HexLayoutContext,
  radius: number,
): HexTraverser {
  return function* () {
    for (let r = 0; r <= radius; r++) {
      const rings = ringTraverser(ctx, r);
      for (const pos of rings()) {
        yield pos;
      }
    }
  };
}

// flood fill
export function getReachable(
  start: HexCoordinate,
  distance: number,
  obstacleTest: (coord: HexCoordinate) => boolean,
) {
  const visited = new Set<SerializedCoordinate>();
  visited.add(serializeCoordinate(start));
  const fringes = [[start]];

  for (let d = 1; d <= distance; d++) {
    const layer: HexCoordinate[] = [];
    fringes.push(layer);
    for (const prev of fringes[d - 1]) {
      for (let dir = 0; dir < 6; dir++) {
        const neighbor = getNeighbor(prev, dir);
        if (
          !visited.has(serializeCoordinate(neighbor)) &&
          !obstacleTest(neighbor)
        ) {
          layer.push(neighbor);
          visited.add(serializeCoordinate(neighbor));
        }
      }
    }
  }
}

export function breadthFirstSearch(
  start: HexCoordinate,
  distance: number,
  obstacleTest: (coord: HexCoordinate) => boolean,
) {
  const costSoFar: Record<SerializedCoordinate, number> = {};
  const cameFrom: Record<SerializedCoordinate, HexCoordinate | null> = {};
  costSoFar[serializeCoordinate(start)] = 0;
  cameFrom[serializeCoordinate(start)] = null;
  const fringes = [[start]];
  for (let k = 0; k <= distance; k++) {
    fringes[k + 1] = [];
    for (let hex of fringes[k]) {
      for (let dir = 0; dir < 6; dir++) {
        const neighbor = getNeighbor(hex, dir);
        if (
          costSoFar[serializeCoordinate(neighbor)] === undefined &&
          !obstacleTest(neighbor)
        ) {
          costSoFar[serializeCoordinate(neighbor)] = k + 1;
          cameFrom[serializeCoordinate(neighbor)] = hex;
          fringes[k + 1].push(neighbor);
        }
      }
    }
  }

  return { costSoFar, cameFrom };
}

export function pathfind(
  start: HexCoordinate,
  end: HexCoordinate,
  obstacleTest: (coord: HexCoordinate) => boolean,
  maxLength: number,
): HexCoordinate[] | null {
  const { cameFrom } = breadthFirstSearch(start, maxLength, obstacleTest);
  const path: HexCoordinate[] = [];
  const seen = new Set<SerializedCoordinate>();

  // end point was never found in bfs
  if (!cameFrom[serializeCoordinate(end)]) {
    return null;
  }

  for (
    let hex: HexCoordinate | null = end;
    !!hex;
    hex = cameFrom[serializeCoordinate(hex)]
  ) {
    if (seen.has(serializeCoordinate(hex))) {
      // sanity check
      throw new Error('Pathfinding produced a cycle');
    }
    path.push(hex);
    seen.add(serializeCoordinate(hex));
  }

  if (path.length === 0) {
    return null;
  }

  if (path.length > maxLength) {
    return null;
  }

  return path.reverse();
}
