import { getS, HexCoordinate } from './coordinates.js';

// these are 2x2 matrices, but expressed as single array for compactness
type OrientationMatrix = [number, number, number, number];

const pointyForwardMatrix: OrientationMatrix = [
  Math.sqrt(3),
  Math.sqrt(3) / 2,
  0,
  3 / 2,
];
const pointyInverseMatrix: OrientationMatrix = [
  Math.sqrt(3) / 3,
  -1 / 3,
  0,
  2 / 3,
];
const pointyInitialAngleRad = Math.PI / 6; // 30 deg

const flatForwardMatrix: OrientationMatrix = [
  3 / 2,
  0,
  Math.sqrt(3) / 2,
  Math.sqrt(3),
];
const flatInverseMatrix: OrientationMatrix = [
  2 / 3,
  0,
  -1 / 3,
  Math.sqrt(3) / 3,
];
const flatInitialAngleRad = 0;

type LayoutDetails = {
  forward: OrientationMatrix;
  inverse: OrientationMatrix;
  initialAngleRad: number;
};

const layouts: Record<'pointy' | 'flat', LayoutDetails> = {
  pointy: {
    forward: pointyForwardMatrix,
    inverse: pointyInverseMatrix,
    initialAngleRad: pointyInitialAngleRad,
  },
  flat: {
    forward: flatForwardMatrix,
    inverse: flatInverseMatrix,
    initialAngleRad: flatInitialAngleRad,
  },
};

export interface HexLayoutContext {
  orientation: 'pointy' | 'flat';
  size: [number, number]; // width, height in pixels of hex tiles. set to same for uniform hex, can be different for squashed (like pixel art)
  origin?: [number, number]; // origin in pixels of the hex grid, if not 0,0
}

function applyLayoutMatrix(coord: HexCoordinate, matrix: OrientationMatrix) {
  const x = matrix[0] * coord[0] + matrix[1] * coord[1];
  const y = matrix[2] * coord[0] + matrix[3] * coord[1];
  return [x, y];
}

export function coordinateToScreenCenter(
  coord: HexCoordinate,
  ctx: HexLayoutContext,
) {
  const layout = layouts.pointy;
  const [x, y] = applyLayoutMatrix(coord, layout.forward);
  return [
    x * ctx.size[0] + (ctx.origin?.[0] || 0),
    y * ctx.size[1] + (ctx.origin?.[1] || 0),
  ] as [number, number];
}

/**
 * Returns a fractional hex coordinate. Use roundFractionalCoordinate to get the true hex coordinate.
 */
export function screenToCoordinate(
  pixel: [number, number],
  ctx: HexLayoutContext,
): HexCoordinate {
  const layout = layouts[ctx.orientation];
  const [x, y] = applyLayoutMatrix(pixel, layout.inverse);
  return [
    x / ctx.size[0] - (ctx.origin?.[0] || 0),
    y / ctx.size[1] - (ctx.origin?.[1] || 0),
  ] as [number, number];
}

export function roundFractionalCoordinate(
  fractional: HexCoordinate,
): HexCoordinate {
  const originalS = getS(fractional);
  const rounded = fractional.map(Math.round) as HexCoordinate;
  let s = getS(rounded);
  let [q, r] = rounded;

  const qDiff = Math.abs(q - fractional[0]);
  const rDiff = Math.abs(r - fractional[1]);
  const sDiff = Math.abs(s - originalS);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return [r, q];
}

export function cornerOffset(
  corner: number,
  ctx: HexLayoutContext,
): [number, number] {
  const layout = layouts[ctx.orientation];
  const angle = layout.initialAngleRad + (corner * Math.PI) / 3;
  return [Math.cos(angle) * ctx.size[0], Math.sin(angle) * ctx.size[1]];
}

export function getHexCorners(
  coord: HexCoordinate,
  ctx: HexLayoutContext,
): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => cornerOffset(i, ctx)).map(
    (offset) => [offset[0] + coord[0], offset[1] + coord[1]],
  );
}
