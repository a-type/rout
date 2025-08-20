import { HexCoordinate } from './coordinates.js';

/**
 * A datastructure for storing hexagonal grid cells. Can be directly
 * used in game GlobalState.
 */
export type HexMap<CellData> = Record<SerializedCoordinate, CellData>;

export function getCell<T>(
  map: HexMap<T>,
  coordinate: HexCoordinate,
): T | null {
  if (!Array.isArray(coordinate)) {
    throw new Error('Invalid coordinate: must be a tuple');
  }
  return map[serializeCoordinate(coordinate)] || null;
}

export function setCell<T>(
  map: HexMap<T>,
  coordinate: HexCoordinate,
  value: T,
) {
  if (!Array.isArray(coordinate)) {
    throw new Error('Invalid coordinate: must be a tuple');
  }
  map[serializeCoordinate(coordinate)] = value;
}

export function deleteCell(map: HexMap<any>, coordinate: HexCoordinate) {
  if (!Array.isArray(coordinate)) {
    throw new Error('Invalid coordinate: must be a tuple');
  }
  delete map[serializeCoordinate(coordinate)];
}

export function mapIterator<T>(
  map: HexMap<T>,
): IterableIterator<[HexCoordinate, T]> {
  return (function* () {
    for (const [coordKey, cell] of Object.entries(map)) {
      const position = deserializeCoordinate(coordKey);
      yield [position, cell];
    }
  })();
}

export type SerializedCoordinate = string;

export function serializeCoordinate(
  coord: HexCoordinate,
): SerializedCoordinate {
  return `${coord[0]},${coord[1]}`;
}

export function deserializeCoordinate(
  serialized: SerializedCoordinate,
): HexCoordinate {
  const [q, r] = serialized.split(',').map(Number);
  return [q, r];
}
