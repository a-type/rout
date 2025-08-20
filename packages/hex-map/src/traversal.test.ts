import { describe, expect, it } from 'vitest';
import { coordinatesEqual, HexCoordinate } from './coordinates.js';
import { HexLayoutContext } from './rendering.js';
import {
  collectTraversals,
  diamondTraverser,
  hexagonTraverser,
  lineTraverser,
  pathfind,
  rectangleTraverser,
  ringTraverser,
  spiralTraverser,
  triangleTraverser,
} from './traversal.js';

describe('map traversers', () => {
  describe.each(['pointy', 'flat'] as const)(
    'layout: %s top',
    (orientation) => {
      const ctx: HexLayoutContext = {
        orientation,
        size: [100, 100],
      };

      it('traverses diamonds', () => {
        expect(collectTraversals(diamondTraverser(ctx, 2))).toMatchSnapshot();
      });
      it('traverses triangles', () => {
        expect(
          collectTraversals(triangleTraverser(ctx, 6, 0)),
        ).toMatchSnapshot();
      });
      it('traverses hexagons', () => {
        expect(collectTraversals(hexagonTraverser(ctx, 3))).toMatchSnapshot();
      });
      it('traverses rectangles', () => {
        expect(
          collectTraversals(rectangleTraverser(ctx, 7, 5)),
        ).toMatchSnapshot();
      });
      it('traverses rings', () => {
        expect(collectTraversals(ringTraverser(ctx, 3))).toMatchSnapshot();
      });
      it('traverses spirals', () => {
        expect(collectTraversals(spiralTraverser(ctx, 3))).toMatchSnapshot();
      });
    },
  );

  it('traverses lines (orientation independent)', () => {
    expect(collectTraversals(lineTraverser([-2, 2], [2, 2]))).toMatchSnapshot();
    expect(collectTraversals(lineTraverser([0, 0], [4, 1]))).toMatchSnapshot();
  });

  it('traverses a ring of radius 0', () => {
    expect(
      collectTraversals(
        ringTraverser({ orientation: 'pointy', size: [100, 100] }, 0),
      ),
    ).toEqual([[0, 0]]);
  });
});

describe('pathfinding', () => {
  it('can find a path from start to end', () => {
    const start: HexCoordinate = [0, 0];
    const end: HexCoordinate = [3, -3];
    const obstacleTest = (coord: HexCoordinate) => {
      if (coordinatesEqual(coord, [1, -1])) return true;
      return false;
    };

    const path = pathfind(start, end, obstacleTest, 10);
    expect(path).toEqual([
      [0, 0],
      [0, -1],
      [1, -2],
      [2, -3],
      [3, -3],
    ]);
  });

  it('detects impossible paths', () => {
    const start: HexCoordinate = [0, 0];
    const end: HexCoordinate = [3, -3];
    const obstacleTest = (coord: HexCoordinate) => {
      // wall it in
      if (
        (
          [
            [2, -3],
            [3, -4],
            [4, -4],
            [4, -3],
            [3, -2],
            [2, -2],
          ] as HexCoordinate[]
        ).some((c) => coordinatesEqual(coord, c))
      )
        return true;
      return false;
    };

    const path = pathfind(start, end, obstacleTest, 10);
    expect(path).toBe(null);
  });

  it('detects paths too long to reach due to straight length', () => {
    const start: HexCoordinate = [0, 0];
    const end: HexCoordinate = [3, -3];
    const obstacleTest = () => false;
    expect(pathfind(start, end, obstacleTest, 3)).toBe(null);
    // reachable with greater allowed length
    expect(pathfind(start, end, obstacleTest, 4)).not.toBe(null);
  });

  it('detects paths too long to reach due to obstacles', () => {
    const start: HexCoordinate = [0, 0];
    const end: HexCoordinate = [3, -3];
    const obstacleTest = (coord: HexCoordinate) => {
      // ring around the origin, with only the furthest away
      // spot open
      return (
        [
          [-1, 0],
          [0, -1],
          [1, -1],
          [1, 0],
          [0, 1],
        ] as HexCoordinate[]
      ).some((c) => coordinatesEqual(coord, c));
    };

    expect(pathfind(start, end, obstacleTest, 8)).toBe(null);
    // reachable with more length
    expect(pathfind(start, end, obstacleTest, 9)).toMatchInlineSnapshot(`
      [
        [
          0,
          0,
        ],
        [
          -1,
          1,
        ],
        [
          -1,
          2,
        ],
        [
          0,
          2,
        ],
        [
          1,
          1,
        ],
        [
          2,
          0,
        ],
        [
          2,
          -1,
        ],
        [
          2,
          -2,
        ],
        [
          3,
          -3,
        ],
      ]
    `);
  });
});
