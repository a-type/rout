import { GameMember, GameRandom } from '@long-game/game-definition';
import { expect, it } from 'vitest';
import { gameDefinition, GlobalState } from './gameDefinition.js';

it('applies non-battle placements', () => {
  const random = new GameRandom('seed');
  const members: GameMember[] = [{ id: 'u-1' }, { id: 'u-2' }];
  const newState = gameDefinition.getState!({
    initialState: gameDefinition.getInitialGlobalState({ members, random }),
    members,
    random,
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 0, y: 0 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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
  expect(newState.grid[0][0]).toEqual({ playerId: 'u-1', power: 1 });
  expect(newState.grid[1][1]).toEqual({ playerId: 'u-2', power: 1 });
});

it('resolves a battle between a territory and a solo placement', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-1', power: 1 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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

  expect(newState.grid[1][1]).toEqual({ playerId: 'u-1', power: 1 });
});

it('resolves a battle between two territories of different powers', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-2', power: 1 },
      ],
      [
        { playerId: 'u-1', power: 1 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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
      // player 1 ends up with 1 large territory with only 1
      // total power, since it neutralized player 2's existing
      // territory with a 2-1 advantage (2 - 1 = 1)
      // note: subtracted cells are not strictly defined;
      // if these 0 move to another of 1's cells that's fine.
      { playerId: 'u-1', power: 0 },
      { playerId: null, power: 0 },
    ],
    [
      { playerId: 'u-1', power: 0 },
      { playerId: 'u-1', power: 1 },
    ],
  ]);
});

it('resolves a battle between two territories of the same power with MAD', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: null, power: 0 },
        { playerId: 'u-2', power: 1 },
      ],
      [
        { playerId: 'u-1', power: 1 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 1, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-1', power: 1 },
      ],
      [
        { playerId: 'u-2', power: 1 },
        { playerId: 'u-2', power: 1 },
        { playerId: null, power: 0 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
        { playerId: 'u-1', power: 1 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 2, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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
      // player 1's larger territory should lose 2 power.
      // 1 is lost to neutralize 1 of player 2's existing
      // units, the other is 'moved' to the battlefield
      // once it is taken. this leaves player 1 with 3 total
      // power in their remaining territory (which now includes
      // the battlefield), representing 2 power from the
      // neutralization of territories (4 - 2 = 2) and 1
      // from the capture of the battlefield.
      { playerId: 'u-1', power: 1 },
      { playerId: 'u-1', power: 0 },
      { playerId: 'u-1', power: 0 },
    ],
    [
      // player 2 should lose their territory
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
      // player 1 wins the battle
      { playerId: 'u-1', power: 1 },
    ],
    [
      // player 1's smaller territory loses 1 power and is disbanded
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
    ],
  ]);
});

it('adds to an existing territory if player who owns it places there', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-1', power: 1 },
      ],
      [
        { playerId: 'u-1', power: 1 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 0, y: 0 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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

  expect(newState.grid[0][0]).toEqual({ playerId: 'u-1', power: 2 });
});

it('allows playing 2 tiles per turn', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
    ],
  };
  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
              ],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
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
      { playerId: 'u-1', power: 1 },
      { playerId: 'u-1', power: 1 },
    ],
    [
      { playerId: null, power: 0 },
      { playerId: 'u-2', power: 1 },
    ],
  ]);
});

it('prevents turns with > 2 tiles', () => {
  expect(
    gameDefinition.validateTurn({
      playerState: {
        grid: [],
      },
      members: [],
      roundIndex: 0,
      turn: {
        playerId: 'u-1',
        data: {
          placements: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
          ],
        },
      },
    }),
  ).toBe('You can place up to 2 tiles');
});

it('applies correct power if both turns are used on the same empty cell', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
    ],
  };
  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
              ],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });
  expect(newState.grid[0][0]).toEqual({ playerId: 'u-1', power: 2 });
});

it('resolves a battle where one player applies 2 placements directly to the battlefield', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: 'u-1', power: 1 },
        { playerId: null, power: 0 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 0, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
            data: {
              placements: [
                { x: 0, y: 1 },
                { x: 0, y: 1 },
              ],
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

it('involves just-placed conjoined reinforcements in battles between territories', () => {
  const initialState: GlobalState = {
    grid: [
      [
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-1', power: 1 },
        { playerId: 'u-1', power: 1 },
      ],
      [
        { playerId: null, power: 0 },
        { playerId: 'u-2', power: 1 },
        { playerId: null, power: 0 },
      ],
    ],
  };

  const newState = gameDefinition.getState!({
    initialState,
    members: [{ id: 'u-1' }, { id: 'u-2' }],
    random: new GameRandom('seed'),
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              placements: [{ x: 2, y: 1 }],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
            data: {
              placements: [
                // reinforcing to the rear
                { x: 0, y: 1 },
                { x: 2, y: 1 },
              ],
            },
            createdAt: new Date().toUTCString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });

  expect(newState.grid).toEqual([
    // player 2 is defeated and their reinforcement is also
    // included in that
    [
      // player 1 expended 2 total power to neutralize
      // player 2's existing claim plus the reinforcement,
      // and 1 power from this preexisting territory 'moves'
      // to the battlefield position.
      { playerId: 'u-1', power: 0 },
      { playerId: 'u-1', power: 0 },
      { playerId: 'u-1', power: 0 },
    ],
    [
      { playerId: null, power: 0 },
      { playerId: null, power: 0 },
      { playerId: 'u-1', power: 1 },
    ],
  ]);
});
