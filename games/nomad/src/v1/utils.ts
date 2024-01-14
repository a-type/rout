import { CoordinateKey } from './gameDefinition.js';

export function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function last<T>(arr: Array<T>): T | undefined {
  return arr ? arr[arr.length - 1] : undefined;
}

export function sum(arr: Array<number>): number {
  return arr.reduce((acc, n) => acc + n, 0);
}

export function removeFirst<T>(arr: Array<T>, predicate: (t: T) => boolean) {
  const index = arr.findIndex(predicate);
  if (index === -1) return arr;
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

export function generateAxialGrid(q: number, r: number): Array<CoordinateKey> {
  const grid: Array<CoordinateKey> = [];
  for (let x = -q; x <= q; x++) {
    for (let y = -r; y <= r; y++) {
      if (Math.abs(x + y) <= q) {
        grid.push(`${x},${y}`);
      }
    }
  }
  return grid;
}

export function axialDistance(a: CoordinateKey, b: CoordinateKey): number {
  const [ax, ay] = coordinateKeyToTuple(a);
  const [bx, by] = coordinateKeyToTuple(b);
  return Math.max(
    Math.abs(ax - bx),
    Math.abs(ay - by),
    Math.abs(ax + ay - bx - by),
  );
}
export function coordinateKeyToTuple(a: CoordinateKey): [number, number] {
  return a.split(',').map((n) => parseInt(n, 10)) as [number, number];
}

export function axialToOffset([ax, ay]: [number, number]): [number, number] {
  return [ax, ay + Math.floor(ax / 2)];
}

export function offsetToAxial(a: [number, number]): [number, number] {
  const [x, y] = a;
  return [x, y - Math.floor(x / 2)];
}
