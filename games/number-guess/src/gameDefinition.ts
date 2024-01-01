import { GameDefinition, Move } from '@long-game/game-definition';
import { lazy } from 'react';

export type GlobalState = {
  secretNumber: number;
  playerGuesses: {
    [playerId: string]: number[];
  };
};

export type PlayerState = {
  playerGuesses: {
    [playerId: string]: number[];
  };
};

export type MoveData = {
  guess: number;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData
> = {
  id: 'number-guess',
  getInitialGlobalState: () => ({
    secretNumber: Math.floor(Math.random() * 100),
    playerGuesses: {},
  }),

  isValidTurn: (playerState, moves) => {
    if (moves.length !== 1) {
      return false;
    }

    const move = moves[0];

    if (move.data.guess < 0 || move.data.guess > 100) {
      return false;
    }

    return true;
  },

  getProspectivePlayerState: (playerState, playerId, prospectiveMoves) => {
    return {
      ...playerState,
      playerGuesses: {
        ...playerState.playerGuesses,
        [playerId]: [
          ...playerState.playerGuesses[playerId],
          prospectiveMoves[0].data.guess,
        ],
      },
    };
  },

  getPlayerState: (globalState, playerId) => {
    return {
      playerGuesses: globalState.playerGuesses,
    };
  },

  getState: (moves) => {
    const initialState = gameDefinition.getInitialGlobalState();
    return moves.reduce(applyMoveToGlobalState, { ...initialState });
  },

  Client: lazy(() => import('./Client.js')),
};

const applyMoveToGlobalState = (
  globalState: GlobalState,
  move: Move<MoveData>,
) => {
  return {
    ...globalState,
    playerGuesses: {
      ...globalState.playerGuesses,
      [move.userId]: [
        ...globalState.playerGuesses[move.userId],
        move.data.guess,
      ],
    },
  };
};
