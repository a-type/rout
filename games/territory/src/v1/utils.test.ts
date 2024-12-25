import { expect, it } from 'vitest';
import { getAllTerritories, getContiguousTerritories } from './utils.js';

it('finds all territories', () => {
  const grid = [
    [
      { playerId: '1', power: 1 },
      { playerId: '1', power: 1 },
      { playerId: null, power: 1 },
    ],
    [
      { playerId: '1', power: 1 },
      { playerId: '2', power: 1 },
      { playerId: '1', power: 1 },
    ],
  ];
  const territories = getAllTerritories(grid);
  expect(territories).toEqual([
    {
      playerId: '1',
      cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      totalPower: 3,
    },
    { playerId: '2', cells: [{ x: 1, y: 1 }], totalPower: 1 },
    {
      playerId: '1',
      cells: [{ x: 2, y: 1 }],
      totalPower: 1,
    },
  ]);
});

it('finds contiguous territories to an empty cell', () => {
  const grid = [
    [
      { playerId: '1', power: 1 },
      { playerId: '1', power: 1 },
      { playerId: null, power: 1 },
    ],
    [
      { playerId: '1', power: 1 },
      { playerId: '2', power: 1 },
      { playerId: '1', power: 1 },
    ],
  ];
  const territories = getContiguousTerritories(grid, 2, 0);
  expect(territories).toEqual([
    {
      cells: [{ x: 2, y: 1 }],
      playerId: '1',
      totalPower: 1,
    },
    {
      cells: [
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ],
      playerId: '1',
      totalPower: 3,
    },
  ]);
});
