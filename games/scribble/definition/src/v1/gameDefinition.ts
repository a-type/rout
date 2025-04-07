import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { getPlayerSequenceIndexes } from './ordering';

export interface DescriptionItem {
  kind: 'description';
  description: string;
  playerId: string;
}

export interface Drawing {
  strokes: {
    path: number[][];
    color: 'light' | 'dark' | 'contrast';
  }[];
}

export interface DrawingItem {
  kind: 'drawing';
  drawing: Drawing;
  playerId: string;
}

export interface StartItem {
  kind: 'start';
  type: 'drawing' | 'description';
}

export type SequenceItem = StartItem | DescriptionItem | DrawingItem;

export type GlobalState = {
  sequences: SequenceItem[][];
};

export type PlayerState = {
  tasks: SequenceItem[];
  // pairs of drawing and description which this player has
  // previously completed. their contribution will always be
  // the last item in the grouping
  // [ [ [task, completion], [task, completion] ], [ [task, completion], [task, completion] ] ... ]
  history: SequenceItem[][][];
};

export type TurnData = {
  taskCompletions: SequenceItem[];
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {},

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // match tasks to completions and add them to history
    return {
      ...playerState,
      history: [
        ...playerState.history,
        playerState.tasks.map((task, index) => [
          task,
          prospectiveTurn.data.taskCompletions[index],
        ]),
      ],
    };
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    // each player will contribute 2 sequences. we start with a description and drawing from each player.
    return {
      sequences: new Array(members.length * 2)
        .fill(null)
        .map((_, i) => [
          { kind: 'start', type: i % 2 === 0 ? 'description' : 'drawing' },
        ]),
    };
  },

  getPlayerState: ({ globalState, playerId, rounds, members }) => {
    const playerIndex = members.findIndex((member) => member.id === playerId);
    const roundIndex = rounds.length;
    const history = new Array(Math.max(0, roundIndex - 1))
      .fill(null)
      .map((_, i) => {
        const sequenceIndexes = getPlayerSequenceIndexes({
          sequenceCount: globalState.sequences.length,
          roundIndex: i,
          playerIndex,
        });
        // get previous and current items for this round index for each sequence the player played on that round
        return sequenceIndexes.map((seqIndex) => {
          return globalState.sequences[seqIndex].slice(i - 1, i);
        });
      });
    // player's tasks are the latest prompts from each sequence they are assigned this round
    const tasks = getPlayerSequenceIndexes({
      sequenceCount: globalState.sequences.length,
      roundIndex,
      playerIndex,
    }).map((seqIndex, taskIndex) => {
      const sequencePrompt = globalState.sequences[seqIndex][roundIndex];
      return sequencePrompt;
    });
    return {
      history,
      tasks,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, roundIndex, members }) => {
    // add the new turn to the sequences
    const sequences = [...globalState.sequences];
    round.turns.forEach((turn, i) => {
      const playerIndex = members.findIndex(
        (member) => member.id === turn.playerId,
      );
      const sequenceIndexes = getPlayerSequenceIndexes({
        sequenceCount: globalState.sequences.length,
        roundIndex: roundIndex,
        playerIndex,
      });
      sequenceIndexes.forEach((seqIndex, i) => {
        sequences[seqIndex].push(turn.data.taskCompletions[i]);
      });
    });
    return {
      ...globalState,
      sequences,
    };
  },

  getPublicTurn: ({ turn }) => {
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    return {
      status: 'active',
    };
  },
};
