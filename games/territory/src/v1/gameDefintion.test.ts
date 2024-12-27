import { GameRandom } from '@long-game/game-definition';
import { expect, it } from 'vitest';
import { gameDefinition, GlobalState } from './gameDefinition.js';

it('applies non-battle placements', () => {
  const random = new GameRandom('seed');
  const members = [{ id: '1' }, { id: '2' }];
  const newState = gameDefinition.getState({
    initialState: gameDefinition.getInitialGlobalState({ members, random }),
    members,
    random,
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: '1',
            data: {
              placements: [{ x: 0, y: 0 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: '2',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });
  expect(newState.grid[0][0]).toEqual({ playerId: '1', power: 1 });
  expect(newState.grid[1][1]).toEqual({ playerId: '2', power: 1 });
});

it('resolves a battle between a territory and a solo placement', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: '1', power: 1 },
        { playerId: '1', power: 1 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState({
    initialState,
    members: [{ id: '1' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: '1',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: '2',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });

  expect(newState.grid[1][1]).toEqual({ playerId: '1', power: 1 });
});

it('resolves a battle between two territories of different powers', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: '1', power: 1 },
        { playerId: '2', power: 1 },
      ],
      [
        { playerId: '1', power: 1 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState({
    initialState,
    members: [{ id: '1' }, { id: '2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: '1',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: '2',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });

  expect(newState.grid).toEqual([
    [
      { playerId: '1', power: 1 },
      { playerId: null, power: 0 },
    ],
    [
      // note: subtracted cell is not strictly defined;
      // if this 0 moves to another of 1's cells that's fine.
      { playerId: '1', power: 0 },
      { playerId: '1', power: 1 },
    ],
  ]);
});

it('resolves a battle between two territories of the same power with MAD', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: null, power: 0 },
        { playerId: '2', power: 1 },
      ],
      [
        { playerId: '1', power: 1 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState({
    initialState,
    members: [{ id: '1' }, { id: '2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: '1',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: '2',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });

  expect(newState.grid).toEqual([
    [
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
    ],
    [
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
    ],
  ]);
});

it('resolves a battle where one player has multiple adjacent territories', () => {
  // requires a 3x3 grid to test this
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: '1', power: 1 },
        { playerId: '1', power: 1 },
        { playerId: '1', power: 1 },
      ],
      [
        { playerId: '2', power: 1 },
        { playerId: '2', power: 1 },
        { playerId: null, power: 0 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
        { playerId: '1', power: 1 },
      ],
    ],
  };

  const newState = gameDefinition.getState({
    initialState,
    members: [{ id: '1' }, { id: '2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: '1',
            data: {
              placements: [{ x: 2, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: '2',
            data: {
              placements: [{ x: 2, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });

  expect(newState.grid).toEqual([
    [
      // player 1's larger territory should lose 1 power
      { playerId: '1', power: 1 },
      { playerId: '1', power: 1 },
      { playerId: '1', power: 0 },
    ],
    [
      // player 2 should lose their territory
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
      // player 1 wins the battle
      { playerId: '1', power: 1 },
    ],
    [
      // player 1's smaller territory loses 1 power and is disbanded
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
    ],
  ]);
});
