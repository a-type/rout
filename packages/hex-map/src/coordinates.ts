export type HexCoordinate = [number, number];

// shorthand way to make a coordinate
export function coord(q: number, r: number): HexCoordinate {
  return [q, r];
}

export function coordinatesEqual(a: HexCoordinate, b: HexCoordinate): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

// the 'hidden' third coordinate value; q + r + s = 0 by definition
// so it's always "- q - r"
export function getS(coord: HexCoordinate) {
  return -coord[0] - coord[1];
}

export function fromRS(r: number, s: number): HexCoordinate {
  return [-r - s, r];
}
export function fromQS(q: number, s: number): HexCoordinate {
  return [q, -q - s];
}

export function addCoordinates(
  a: HexCoordinate,
  b: HexCoordinate,
): HexCoordinate {
  return [a[0] + b[0], a[1] + b[1]];
}

export function subtractCoordinates(
  a: HexCoordinate,
  b: HexCoordinate,
): HexCoordinate {
  return addCoordinates(a, [-b[0], -b[1]]);
}

export function multiplyCoordinate(
  coord: HexCoordinate,
  scale: number,
): HexCoordinate {
  return [coord[0] * scale, coord[1] * scale];
}

export function coordinateLength(a: HexCoordinate) {
  return Math.floor((Math.abs(a[0]) + Math.abs(a[1]) + Math.abs(getS(a))) / 2);
}

export function coordinateDistance(a: HexCoordinate, b: HexCoordinate): number {
  return coordinateLength(subtractCoordinates(a, b));
}

const coordinateDirections: HexCoordinate[] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
];
/**
 * Gets a directional hex vector by index.
 *
 *       0
 * 5    ---    1
 *    /  q  \
 *    \s   r/
 * 4    ---    2
 *       3
 */
export function getDirection(dir: number): HexCoordinate {
  return coordinateDirections[(6 + (dir % 6)) % 6];
}

export function getNeighbor(coord: HexCoordinate, dir: number) {
  const direction = getDirection(dir);
  return addCoordinates(coord, direction);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpCoordinates(
  start: HexCoordinate,
  end: HexCoordinate,
  t: number,
): HexCoordinate {
  return [lerp(start[0], end[0], t), lerp(start[1], end[1], t)];
}

export function rotateCoordinate(
  coord: HexCoordinate,
  /** Only rotations in increments of 60 deg (Pi / 3) are supported */
  turnsOf60Degrees: number,
  origin: HexCoordinate = [0, 0],
) {
  const direction = Math.sign(turnsOf60Degrees);
  for (let i = 0; i < Math.abs(turnsOf60Degrees); i++) {
    coord = rotateCoordinateOnce(coord, direction, origin);
  }
  return coord;
}

function rotateCoordinateOnce(
  coord: HexCoordinate,
  direction: number,
  origin: HexCoordinate = [0, 0],
): HexCoordinate {
  const adjusted = subtractCoordinates(coord, origin);
  const s = getS(adjusted);
  if (direction < 0) {
    return addCoordinates(origin, [-s, -adjusted[0]]);
  } else {
    return addCoordinates(origin, [-adjusted[1], -s]);
  }
}
