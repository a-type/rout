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

it('resolves a battle between two territories', () => {});
