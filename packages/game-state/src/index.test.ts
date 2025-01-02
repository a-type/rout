import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { expect, it } from 'vitest';
import { GameSessionState } from './index.js';

const testGame: GameDefinition<
  { values: Record<string, number> },
  { values: Record<string, number> },
  {}
> = {
  getInitialGlobalState: ({ members }) => ({
    values: Object.fromEntries(members.map((m) => [m.id, 0])),
  }),
  getPlayerState: ({ globalState }) => globalState,
  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    const newState = { ...playerState };
    newState.values[prospectiveTurn.playerId] += 1;
    return newState;
  },
  getPublicTurn: ({ turn }) => turn,
  getRoundIndex: roundFormat.sync(),
  getState: ({ initialState, rounds }) => {
    const state = { ...initialState };
    for (const round of rounds) {
      for (const turn of round.turns) {
        state.values[turn.playerId] += 1;
      }
    }
    return state;
  },
  getStatus: ({ rounds }) => {
    if (rounds.length === 0) return { status: 'pending' };
    return { status: 'active' };
  },
  validateTurn: () => {},
  maximumPlayers: 100,
  minimumPlayers: 1,
  version: 'v1.0',

  Client: () => null,
  GameRecap: () => null,
};

const testDate = new Date().toUTCString();

it('should compute player state for a specific prior round', () => {
  const gameState = new GameSessionState(
    {
      gameId: 'g-1',
      gameVersion: 'v1.0',
      id: 'gs-1',
      randomSeed: 'random',
      startedAt: testDate,
      timezone: 'UTC',
    },
    testGame,
    [
      { createdAt: testDate, data: {}, playerId: 'u-1', roundIndex: 0 },
      { createdAt: testDate, data: {}, playerId: 'u-2', roundIndex: 0 },
      { createdAt: testDate, data: {}, playerId: 'u-1', roundIndex: 1 },
      { createdAt: testDate, data: {}, playerId: 'u-2', roundIndex: 1 },
      { createdAt: testDate, data: {}, playerId: 'u-1', roundIndex: 2 },
    ],
    [{ id: 'u-1' }, { id: 'u-2' }],
  );
  const playerState = gameState.getPlayerStateAtRound({
    playerId: 'u-1',
    roundIndex: 1,
  });
  expect(playerState.values['u-1']).toBe(2);
  expect(playerState.values['u-2']).toBe(2);
});

it('should compute player state for the current round', () => {
  const gameState = new GameSessionState(
    {
      gameId: 'g-1',
      gameVersion: 'v1.0',
      id: 'gs-1',
      randomSeed: 'random',
      startedAt: testDate,
      timezone: 'UTC',
    },
    testGame,
    [
      { createdAt: testDate, data: {}, playerId: 'u-1', roundIndex: 0 },
      { createdAt: testDate, data: {}, playerId: 'u-2', roundIndex: 0 },
      { createdAt: testDate, data: {}, playerId: 'u-1', roundIndex: 1 },
      { createdAt: testDate, data: {}, playerId: 'u-2', roundIndex: 1 },
      { createdAt: testDate, data: {}, playerId: 'u-1', roundIndex: 2 },
    ],
    [{ id: 'u-1' }, { id: 'u-2' }],
  );
  const playerState = gameState.getPlayerStateAtRound({
    playerId: 'u-1',
    roundIndex: 2,
  });
  expect(playerState.values['u-1']).toBe(2);
  expect(playerState.values['u-2']).toBe(2);
});
