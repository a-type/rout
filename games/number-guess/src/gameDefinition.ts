import { roundFormat, GameDefinition } from '@long-game/game-definition';
import { lazy } from 'react';

export type GlobalState = {
  secretNumber: number;
};

export type PlayerState = {};

export type MoveData = {
  guess: number;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  MoveData
> = {
  version: 'v1.0',

  getInitialGlobalState: ({ random }) => ({
    secretNumber: random.int(0, 100),
    playerGuesses: {},
  }),

  validateTurn: ({ turn }) => {
    if (turn.data.guess < 0 || turn.data.guess > 100) {
      return 'Your guess must be between 0 and 100';
    }
  },

  getProspectivePlayerState: ({ playerState }) => {
    return playerState;
  },

  // players see nothing; all state is secret in this game.
  getPlayerState: () => {
    return {};
  },

  getState: ({ initialState }) => {
    return initialState;
  },

  getPublicTurn: ({ turn }) => turn,

  getStatus: ({ globalState, rounds }) => {
    const turnsThatGuessedRight = rounds
      .map((r) => r.turns)
      .flat()
      .filter((move) => move.data.guess === globalState.secretNumber);

    if (turnsThatGuessedRight.length > 0) {
      return {
        status: 'completed',
        // exclude nulls - users which have left the game or
        // otherwise invalid moves...
        winnerIds: turnsThatGuessedRight
          .map((move) => move.userId)
          .filter((id): id is string => !!id),
      };
    }

    return {
      status: 'active',
    };
  },

  getRoundIndex: roundFormat.sync(),

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),
};
