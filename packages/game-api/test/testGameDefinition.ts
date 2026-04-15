import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  simpleError,
} from '@long-game/game-definition';

export const testGameDefinition: GameDefinition<{
  GlobalState: {
    randomNumber: number;
    members: {
      id: string;
      displayName: string;
      color: string;
    }[];
    winner: PrefixedId<'u'> | null;
  };
  PlayerState: {
    lastMove: string | null;
  };
  TurnData: {
    move: string;
  };
  InitialTurnData: { move: string };
  PublicTurnData: {
    move: string;
    isPublic: true;
  };
  SetupData: {
    members: {
      id: string;
      displayName: string;
      color: string;
    }[];
  };
}> = {
  version: 'v1',
  minimumPlayers: 1,
  maximumPlayers: 4,
  getInitialGlobalState: ({ random, members }) => {
    return {
      randomNumber: random.int(),
      members,
      winner: null,
    };
  },
  getSetupData: ({ members }) => {
    return {
      members,
    };
  },
  // ignore this, only used client-side...
  // v8 ignore start -- @preserve
  applyProspectiveTurnToPlayerState: ({ prospectiveTurn, playerState }) => {
    return {
      ...playerState,
      lastMove: prospectiveTurn.data,
    };
  },
  // v8 ignore stop -- @preserve
  validateTurn: ({ turn }) => {
    if (turn.data.move === 'invalid') {
      return 'Invalid move: cannot be "invalid"';
    }
    return null;
  },
  validatePartialTurn: ({ turn }) => {
    if (turn.data.move === 'partial-invalid') {
      return simpleError('Invalid move: cannot be "partial-invalid"');
    }
  },
  getPublicTurn: ({ turn }) => {
    return {
      move: turn.data.move,
      isPublic: true,
    };
  },
  getPlayerState: ({ globalState, playerId, roundIndex, rounds }) => {
    const turnThisRound =
      rounds[roundIndex - 1]?.turns.filter((t) => t.playerId === playerId) ??
      [];
    return {
      lastMove: turnThisRound[0]?.data.move ?? null,
    };
  },
  getStatus: ({ rounds, globalState, members }) => {
    if (globalState.winner) {
      return {
        status: 'complete',
        winnerIds: [globalState.winner],
      };
    }
    return {
      status: 'active',
    };
  },
  applyRoundToGlobalState: ({ globalState, round, random }) => {
    for (const turn of round.turns) {
      if (turn.data.move === 'win') {
        globalState.winner = turn.playerId;
      } else if (turn.data.move === 'reroll') {
        globalState.randomNumber = random.int();
      }
    }
  },
  getRoundIndex: roundFormat.sync(),
  getRoundChangeMessages: ({ completedRound }) => {
    return (
      completedRound?.turns
        .filter((turn) => turn.data.move === 'message')
        .map((turn) => ({
          content: `This is a message triggered by a move by ${turn.playerId}`,
        })) ?? [
        {
          content: 'Welcome to the game!',
        },
      ]
    );
  },
};
