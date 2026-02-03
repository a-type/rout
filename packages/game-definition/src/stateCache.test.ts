import { GameRound } from '@long-game/common';
import { describe, expect, it, Mock, vi } from 'vitest';
import { GameDefinition, Turn } from './gameDefinition.js';
import { GameRandom } from './random.js';
import { roundFormat } from './rounds.js';
import { GameStateCache } from './stateCache.js';
import { testPlayer } from './test.js';

const randomSeed = '1234567890abcdef';

type GlobalState = {
  randomValues: number[];
  turnValues: string[];
  initialRandomValue: number;
  playedRounds: number[];
};
type TurnData = { value: string };

function createCache() {
  // this test game is designed to expose the determinism aspects of computation
  // for assertions.
  const game: GameDefinition<{
    GlobalState: GlobalState;
    PlayerState: any;
    TurnData: TurnData;
  }> = {
    version: 'v1.0',
    minimumPlayers: 0,
    maximumPlayers: 100,
    getInitialGlobalState: vi.fn(({ random, members }) => ({
      randomValues: [],
      turnValues: [],
      initialRandomValue: random.int(0, 100),
      playedRounds: [],
    })),
    getPlayerState({ globalState }) {
      return {};
    },
    applyRoundToGlobalState: vi.fn(
      ({ globalState, round, random, members, roundIndex }) => {
        globalState.playedRounds.push(roundIndex);
        for (const turn of round.turns) {
          globalState.randomValues.push(random.int(0, 100));
          globalState.turnValues.push(turn.data.value);
        }
      },
    ),
    applyProspectiveTurnToPlayerState({ playerState }) {},
    getPublicTurn({ turn }) {
      return turn;
    },
    getRoundIndex: roundFormat.sync(),
    getStatus: () => ({
      status: 'pending',
    }),
    validateTurn: () => {},
  };

  return {
    cache: new GameStateCache(game, {
      randomSeed,
      members: [testPlayer(1), testPlayer(2)],
      setupData: null,
    }),
    game,
  };
}

const initialRandomValue = new GameRandom(randomSeed).int(0, 100);

describe('StateCache', () => {
  it('returns initial state with no rounds', () => {
    const { cache } = createCache();
    const state = cache.getState([]);
    expect(state).toEqual({
      randomValues: [],
      turnValues: [],
      initialRandomValue,
      playedRounds: [],
    });
  });

  it('computes state from rounds and caches it', () => {
    const rounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
        ],
      },
    ];

    const { game, cache } = createCache();
    const state = cache.getState(rounds);
    expect(state).toEqual({
      randomValues: [41, 75],
      turnValues: ['a', 'b'],
      initialRandomValue,
      playedRounds: [0, 1],
    });

    // check that the state is cached - it doesn't get computed again
    (game.getInitialGlobalState as Mock).mockClear();
    (game.applyRoundToGlobalState as Mock).mockClear();

    const cachedState = cache.getState(rounds);
    expect(cachedState).toEqual(state);
    expect(game.getInitialGlobalState).not.toHaveBeenCalled();
    expect(game.applyRoundToGlobalState).not.toHaveBeenCalled();
  });

  it('invalidates a cached round if turns change', () => {
    const rounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
        ],
      },
    ];

    const { game, cache } = createCache();
    const state = cache.getState(rounds);
    expect(state).toEqual({
      randomValues: [41, 75],
      turnValues: ['a', 'b'],
      initialRandomValue,
      playedRounds: [0, 1],
    });

    (game.getInitialGlobalState as Mock).mockClear();
    (game.applyRoundToGlobalState as Mock).mockClear();

    const updatedRounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
          {
            data: { value: 'c' },
            createdAt: new Date().toISOString(),
            playerId: 'u-2',
            roundIndex: 1,
          },
        ],
      },
    ];
    const updatedState = cache.getState(updatedRounds);
    expect(updatedState).toEqual({
      randomValues: [41, 75, 17],
      turnValues: ['a', 'b', 'c'],
      initialRandomValue,
      playedRounds: [0, 1],
    });

    expect(game.getInitialGlobalState).not.toHaveBeenCalled();
    expect(game.applyRoundToGlobalState).toHaveBeenCalledTimes(2);
  });

  it('falls back to a prior cached round for a cache miss', () => {
    const firstRounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
        ],
      },
    ];

    const { game, cache } = createCache();
    const state = cache.getState(firstRounds);
    expect(state).toEqual({
      randomValues: [41, 75],
      turnValues: ['a', 'b'],
      initialRandomValue,
      playedRounds: [0, 1],
    });

    (game.getInitialGlobalState as Mock).mockClear();
    (game.applyRoundToGlobalState as Mock).mockClear();

    const nextRounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
        ],
      },
      {
        roundIndex: 2,
        turns: [
          {
            data: { value: 'c' },
            createdAt: new Date().toISOString(),
            playerId: 'u-2',
            roundIndex: 2,
          },
        ],
      },
    ];

    const nextState = cache.getState(nextRounds);
    expect(nextState).toEqual({
      randomValues: [41, 75, 17],
      turnValues: ['a', 'b', 'c'],
      initialRandomValue,
      playedRounds: [0, 1, 2],
    });

    expect(game.getInitialGlobalState).not.toHaveBeenCalled();
    // only 1 round had to be computed
    expect(game.applyRoundToGlobalState).toHaveBeenCalledTimes(1);
  });

  it('falls back to a prior cached round if the latest round is invalidated', () => {
    const rounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
        ],
      },
    ];

    const { game, cache } = createCache();

    // first prime the cache for the first round
    cache.getState(rounds.slice(0, 1));

    const state = cache.getState(rounds);
    expect(state).toEqual({
      randomValues: [41, 75],
      turnValues: ['a', 'b'],
      initialRandomValue,
      playedRounds: [0, 1],
    });

    (game.getInitialGlobalState as Mock).mockClear();
    (game.applyRoundToGlobalState as Mock).mockClear();

    const updatedRounds: GameRound<Turn<TurnData>>[] = [
      {
        roundIndex: 0,
        turns: [
          {
            data: { value: 'a' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 0,
          },
        ],
      },
      {
        roundIndex: 1,
        turns: [
          {
            data: { value: 'b' },
            createdAt: new Date().toISOString(),
            playerId: 'u-1',
            roundIndex: 1,
          },
          {
            data: { value: 'c' },
            createdAt: new Date().toISOString(),
            playerId: 'u-2',
            roundIndex: 1,
          },
        ],
      },
    ];
    const updatedState = cache.getState(updatedRounds);
    expect(updatedState).toEqual({
      randomValues: [41, 75, 17],
      turnValues: ['a', 'b', 'c'],
      initialRandomValue,
      playedRounds: [0, 1],
    });

    expect(game.getInitialGlobalState).not.toHaveBeenCalled();
    // only 1 round had to be computed
    expect(game.applyRoundToGlobalState).toHaveBeenCalledTimes(1);
  });
});
