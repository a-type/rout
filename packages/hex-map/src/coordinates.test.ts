import { expect, it } from 'vitest';
import { coordinateDistance, rotateCoordinate } from './coordinates.js';

it('measures distance between coordinates', () => {
  expect(coordinateDistance([0, 0], [1, -1])).toBe(1);
  expect(coordinateDistance([0, 0], [2, -2])).toBe(2);
  expect(coordinateDistance([0, 0], [2, 2])).toBe(4);
});

it('rotates coordinates around a specific origin', () => {
  expect(rotateCoordinate([3, -4], 2, [1, -1])).toEqual([2, 1]);
  expect(rotateCoordinate([3, -4], -1, [1, -1])).toEqual([0, -3]);
});
