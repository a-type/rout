import { roundFormat, GameDefinition } from '@long-game/game-definition';
import { lazy } from 'react';

export type GlobalState = {
  secretNumber: number;
};

export type PlayerState = {
  lastGuessResult?: 'tooLow' | 'tooHigh' | 'correct';
};

export type MoveData = {
  guess: number;
};

export type PublicMoveData = {
  guess: number;
  result?: 'tooLow' | 'tooHigh' | 'correct';
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  PublicMoveData
> = {
  version: 'v1.0',
  minimumPlayers: 1,
  maximumPlayers: 100,

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
  getPlayerState: ({ globalState, playerId, roundIndex, rounds }) => {
    const previousRound = rounds[roundIndex - 1];
    if (!previousRound) {
      return {};
    } else {
      const lastGuess = previousRound.turns.find(
        (turn) => turn.userId === playerId,
      );
      if (!lastGuess) {
        return {};
      }
      return {
        lastGuessResult:
          lastGuess.data.guess === globalState.secretNumber
            ? 'correct'
            : lastGuess.data.guess < globalState.secretNumber
            ? 'tooLow'
            : 'tooHigh',
      };
    }
  },

  getState: ({ initialState }) => {
    return initialState;
  },

  getPublicTurn: ({ turn, globalState, viewerId }) => {
    if (viewerId !== turn.userId) {
      return turn;
    }

    return {
      ...turn,
      data: {
        guess: turn.data.guess,
        result:
          turn.data.guess === globalState.secretNumber
            ? 'correct'
            : turn.data.guess < globalState.secretNumber
            ? 'tooLow'
            : 'tooHigh',
      },
    };
  },

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
