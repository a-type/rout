import { GameDefinition, Move } from '@long-game/game-definition';
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
  id: 'number-guess',
  title: 'Guess A Number',
  getInitialGlobalState: ({ random }) => ({
    secretNumber: random.int(0, 100),
    playerGuesses: {},
  }),

  validateTurn: ({ moves }) => {
    if (moves.length !== 1) {
      return 'You must make exactly one guess.';
    }

    const move = moves[0];

    if (move.data.guess < 0 || move.data.guess > 100) {
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

  getPublicMove: ({ move }) => move,

  getStatus: ({ globalState, moves }) => {
    const movesThatGuessedRight = moves.filter(
      (move) => move.data.guess === globalState.secretNumber,
    );

    if (movesThatGuessedRight.length > 0) {
      return {
        status: 'completed',
        // exclude nulls - users which have left the game or
        // otherwise invalid moves...
        winnerIds: movesThatGuessedRight
          .map((move) => move.userId)
          .filter((id): id is string => !!id),
      };
    }

    return {
      status: 'active',
    };
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),
};
