import {
  GameDefinition,
  roundFormat,
  SystemChatMessage,
} from '@long-game/game-definition';

export type GlobalState = {
  secretNumber: number;
  setupMessage: string;
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

export const gameDefinition: GameDefinition<{
  GlobalState: GlobalState;
  PlayerState: PlayerState;
  TurnData: MoveData;
  PublicTurnData: PublicMoveData;
  SetupData: { message: string };
}> = {
  version: 'v1.0',
  minimumPlayers: 1,
  maximumPlayers: 100,

  getSetupData: () => ({
    message: 'Welcome to the Number Guessing Game!',
  }),

  getInitialGlobalState: ({ random, setupData }) => ({
    secretNumber: random.int(0, 100),
    playerGuesses: {},
    setupMessage: setupData?.message,
  }),

  validateTurn: ({ turn }) => {
    if (turn.data.guess < 0 || turn.data.guess > 100) {
      return 'Your guess must be between 0 and 100';
    }
  },

  applyProspectiveTurnToPlayerState: ({ playerState }) => {},

  getPlayerState: ({ globalState, playerId, rounds }) => {
    const previousRound = rounds[rounds.length - 1];
    if (!previousRound) {
      return {};
    } else {
      const lastGuess = previousRound.turns.find(
        (turn) => turn.playerId === playerId,
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

  applyRoundToGlobalState: ({ globalState }) => {},

  getPublicTurn: ({ turn, globalState, viewerId }) => {
    if (viewerId !== turn.playerId) {
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
        status: 'complete',
        // exclude nulls - users which have left the game or
        // otherwise invalid moves...
        winnerIds: turnsThatGuessedRight
          .map((move) => move.playerId)
          .filter((id): id is `u-${string}` => !!id),
      };
    }

    return {
      status: 'active',
    };
  },

  getRoundIndex: roundFormat.sync(),

  getRoundChangeMessages(data) {
    const messages: SystemChatMessage[] = [
      {
        content: `Round ${data.roundIndex + 1} has started!`,
      },
    ];
    if (data.completedRound) {
      data.members.forEach((member) => {
        const memberTurn = data.completedRound!.turns.find(
          (t) => t.playerId === member.id,
        );
        if (!memberTurn) {
          return;
        }
        messages.push({
          recipientIds: [member.id],
          content: `Your guess was ${
            memberTurn?.data.guess ?? '(nothing)'
          }. That was ${
            memberTurn?.data.guess === data.globalState.secretNumber
              ? 'correct'
              : memberTurn?.data.guess < data.globalState.secretNumber
                ? 'too low'
                : 'too high'
          }`,
        });
      });
    }
    return messages;
  },
};
