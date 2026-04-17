import { GameRound, LongGameError } from '@long-game/common';
import { GameMember } from '@long-game/game-definition';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { GameApiClient, GameApiClientInit } from '../src/client';
import testServer from './testServer';

beforeAll(testServer);

const shimmedFetch: typeof fetch = (url, init) => {
  const replacedUrl = (url as string).replace(
    'http://game-registry',
    'http://localhost:7777',
  );
  return fetch(replacedUrl, init);
};
const spiedFetch = vi.fn(shimmedFetch);
const members: GameMember[] = [
  {
    id: 'u-1',
    displayName: 'Player 1',
    color: 'red',
  },
  {
    id: 'u-2',
    displayName: 'Player 2',
    color: 'blue',
  },
];
let client!: GameApiClient;

const clientInit: GameApiClientInit = {
  gameId: 'test-game',
  version: 'v1',
  sessionId: 'gs-test-session',
  randomSeed: 'test-seed',
  isDev: true,
  timeZone: 'UTC',
  members,
  setupData: {
    members,
  },

  fetch: spiedFetch,
};

beforeEach(() => {
  spiedFetch.mockClear();

  client = new GameApiClient(clientInit);
});

it('should fetch game details and cache them', async () => {
  expect(await client.getDetails()).toEqual({
    id: 'test-game',
    title: 'Test Game',
    description: 'A game used for testing the game API',
    hasSetupData: true,
    hasRoundChangeMessages: true,
    hasPartialTurnValidation: true,
    aliasIds: [],
    creators: [],
    maximumPlayers: 4,
    minimumPlayers: 1,
    versions: [
      {
        devAPIPort: 7777,
        devUIPort: 7778,
        version: 'v1',
      },
    ],
    screenshots: [],
    prerelease: false,
    tags: [],
  });

  await client.getDetails();
  expect(spiedFetch).toHaveBeenCalledTimes(1);
});

it('should compute setup data', async () => {
  expect(await client.generateSetupData()).toEqual({
    members,
  });
});

it('should skip computing setup data if game details indicate it is not supported', async () => {
  // mock getDetails API to return hasSetupData: false
  spiedFetch.mockImplementationOnce(async (req, init) => {
    const actualRes = await shimmedFetch(req, init);
    const body = (await actualRes.json()) as any;
    return {
      ok: true,
      json: () => ({
        ...body,
        hasSetupData: false,
      }),
    } as unknown as Response;
  });

  // load details to setup cache
  await client.getDetails();
  const result = await client.generateSetupData();
  expect(result).toBeNull();
  expect(spiedFetch).toHaveBeenCalledTimes(1); // only the getDetails API call
});

it('should compute and cache global state according to game rules', async () => {
  // compute global state for round 0
  const globalState1 = await client.computeGlobalState([]);
  expect(globalState1).toEqual({
    randomNumber: expect.any(Number),
    members,
    winner: null,
  });

  // compute global state for round 0 again - should be cached
  const globalState2 = await client.computeGlobalState([]);
  expect(globalState2).toEqual(globalState1);
  expect(spiedFetch).toHaveBeenCalledTimes(1);

  // compute global state for round 1 - should not be cached
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'reroll',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];
  const globalState3 = await client.computeGlobalState(rounds);
  expect(globalState3).toEqual({
    randomNumber: expect.any(Number),
    members,
    winner: null,
  });
  expect(spiedFetch).toHaveBeenCalledTimes(2);
  // re-rolls random number
  expect(globalState3.randomNumber).not.toBe(globalState1.randomNumber);

  // compute global state for round 1 again - should be cached
  const globalState4 = await client.computeGlobalState(rounds);
  expect(globalState4).toEqual(globalState3);
  expect(spiedFetch).toHaveBeenCalledTimes(2);

  // finish the game by having player 1 win in round 2
  rounds.push({
    roundIndex: 1,
    turns: [
      {
        playerId: 'u-1',
        data: {
          move: 'win',
        },
        createdAt: new Date().toISOString(),
        roundIndex: 1,
      },
      {
        playerId: 'u-2',
        data: {
          move: 'none',
        },
        createdAt: new Date().toISOString(),
        roundIndex: 1,
      },
    ],
  });

  const globalState5 = await client.computeGlobalState(rounds);
  expect(globalState5).toEqual({
    randomNumber: globalState4.randomNumber,
    members,
    winner: 'u-1',
  });
  expect(spiedFetch).toHaveBeenCalledTimes(3);
});

it('should support a configurable cache for global state checkpoints', async () => {
  const customCache = {
    get: vi.fn(),
    set: vi.fn(),
  };
  const clientWithCustomCache = new GameApiClient({
    ...clientInit,
    stateCache: customCache,
  });

  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'reroll',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];
  await clientWithCustomCache.computeGlobalState(rounds);

  expect(customCache.get).toHaveBeenCalledWith(0);
  expect(customCache.set).toHaveBeenCalledWith(0, {
    randomState: expect.anything(),
    roundIndex: 0,
    turnCount: 2,
    state: {
      randomNumber: expect.any(Number),
      members,
      winner: null,
    },
  });
});

it('should compute player state according to game rules', async () => {
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'reroll',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];

  const playerState = await client.computePlayerState({
    playerId: 'u-1',
    playerTurn: null,
    rounds,
  });
  expect(playerState).toEqual({
    lastMove: 'reroll',
  });
});

it('should compute current round index for completed round', async () => {
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'reroll',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];

  const roundIndex = await client.computeRoundIndex({
    turns: rounds[0].turns,
    startedAt: new Date().toISOString(),
  });
  expect(roundIndex).toEqual({
    pendingTurns: ['u-1', 'u-2'],
    roundIndex: 1,
  });
});

it('should compute current round index for partial round', async () => {
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'reroll',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];

  const roundIndex = await client.computeRoundIndex({
    turns: rounds[0].turns,
    startedAt: new Date().toISOString(),
  });
  expect(roundIndex).toEqual({
    pendingTurns: ['u-2'],
    roundIndex: 0,
  });
});

it('should compute public turns for multiple players', async () => {
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'reroll',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];

  const publicTurns = await client.computePublicTurns({
    turns: rounds[0].turns,
    rounds,
  });
  expect(publicTurns).toEqual({
    'u-1': {
      playerId: 'u-1',
      data: {
        move: 'reroll',
        isPublic: true,
      },
      createdAt: expect.any(String),
      roundIndex: 0,
    },
    'u-2': {
      playerId: 'u-2',
      data: {
        move: 'none',
        isPublic: true,
      },
      createdAt: expect.any(String),
      roundIndex: 0,
    },
  });
});

it('should validate turns with partial and full validators', async () => {
  const partialInvalidResult = await client.validateTurn({
    rounds: [],
    turn: {
      playerId: 'u-1',
      data: {
        move: 'partial-invalid',
      },
      roundIndex: 0,
    },
  });
  expect(partialInvalidResult).toEqual({
    valid: false,
    message: 'Invalid move: cannot be "partial-invalid"',
  });

  const invalidREsult = await client.validateTurn({
    rounds: [],
    turn: {
      playerId: 'u-1',
      data: {
        move: 'invalid',
      },
      roundIndex: 0,
    },
  });
  expect(invalidREsult).toEqual({
    valid: false,
    message: 'Invalid move: cannot be "invalid"',
  });
});

it('should validate a valid turn', async () => {
  const result = await client.validateTurn({
    rounds: [],
    turn: {
      playerId: 'u-1',
      data: {
        move: 'valid-move',
      },
      roundIndex: 0,
    },
  });
  expect(result).toEqual({
    valid: true,
    message: null,
  });
});

it('should get the status of an active game', async () => {
  const activeStatus = await client.computeStatus({
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              move: 'reroll',
            },
            createdAt: new Date().toISOString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
            data: {
              move: 'none',
            },
            createdAt: new Date().toISOString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });
  expect(activeStatus).toEqual({
    status: 'active',
  });
});

it('should get the status of a completed game', async () => {
  const completedStatus = await client.computeStatus({
    rounds: [
      {
        roundIndex: 0,
        turns: [
          {
            playerId: 'u-1',
            data: {
              move: 'win',
            },
            createdAt: new Date().toISOString(),
            roundIndex: 0,
          },
          {
            playerId: 'u-2',
            data: {
              move: 'none',
            },
            createdAt: new Date().toISOString(),
            roundIndex: 0,
          },
        ],
      },
    ],
  });
  expect(completedStatus).toEqual({
    status: 'complete',
    winnerIds: ['u-1'],
  });
});

it('should compute round change messages for initial round', async () => {
  const messages = await client.computeRoundChangeMessages({
    rounds: [],
    roundIndex: 0,
  });
  expect(messages).toEqual([
    {
      content: 'Welcome to the game!',
    },
  ]);
});

it('should compute round change messages according to game rules', async () => {
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'message',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];

  const messages = await client.computeRoundChangeMessages({
    rounds,
    roundIndex: 1,
  });
  expect(messages).toEqual([
    {
      content: 'This is a message triggered by a move by u-1',
    },
  ]);
});

it('should not compute round change messages if game details indicate they are not supported', async () => {
  // mock getDetails API to return hasRoundChangeMessages: false
  spiedFetch.mockImplementationOnce(async (req, init) => {
    const actualRes = await shimmedFetch(req, init);
    const body = (await actualRes.json()) as any;
    return {
      ok: true,
      json: () =>
        Promise.resolve({
          ...body,
          hasRoundChangeMessages: false,
        }),
    } as unknown as Response;
  });

  // load details to setup cache
  await client.getDetails();

  // compute round change messages - should return empty array without making an API call
  const rounds: GameRound<any>[] = [
    {
      roundIndex: 0,
      turns: [
        {
          playerId: 'u-1',
          data: {
            move: 'message',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
        {
          playerId: 'u-2',
          data: {
            move: 'none',
          },
          createdAt: new Date().toISOString(),
          roundIndex: 0,
        },
      ],
    },
  ];

  const messages = await client.computeRoundChangeMessages({
    rounds,
    roundIndex: 1,
  });
  expect(messages).toEqual([]);
  expect(spiedFetch).toHaveBeenCalledTimes(1); // only the getDetails API call
});

it('should handle an API error', async () => {
  spiedFetch.mockImplementationOnce(async () => {
    return new LongGameError(
      LongGameError.Code.BadRequest,
      'Simulated failure',
    ).toResponse();
  });

  try {
    await client.computeGlobalState([]);
    throw new Error('Expected computeGlobalState to throw an error');
  } catch (error) {
    expect(error).toBeInstanceOf(LongGameError);
    const longGameError = error as LongGameError;
    expect(longGameError.code).toEqual(LongGameError.Code.BadRequest);
    expect(longGameError.message).toEqual('Simulated failure');
  }
});
