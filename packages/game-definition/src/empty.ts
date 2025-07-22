import { GameDefinition } from './gameDefinition.js';

export const emptyGameDefinition: GameDefinition<any, any, any, any, any, any> =
  {
    version: 'v1.0',
    getRoundIndex: () => ({ pendingTurns: [], roundIndex: 0 }),
    applyRoundToGlobalState: () => ({}),
    getInitialGlobalState: () => ({}),
    getPlayerState: () => ({}),
    getPublicTurn: ({ turn }) => turn,
    getStatus: () => ({
      status: 'pending',
    }),
    maximumPlayers: 100,
    minimumPlayers: 1,
    validateTurn: () => {},
    getProspectivePlayerState: () => ({}),
  };
