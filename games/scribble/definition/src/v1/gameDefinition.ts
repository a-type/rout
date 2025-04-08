import { PrefixedId } from '@long-game/common';
import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { getPlayerSequenceIndexes } from './ordering';

export interface DescriptionItem {
  kind: 'description';
  description: string;
  playerId: PrefixedId<'u'>;
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
  playerId: PrefixedId<'u'>;
}

export interface StartItem {
  kind: 'start';
  type: 'drawing' | 'description';
}

export type SequenceItem = StartItem | DescriptionItem | DrawingItem;
export type TaskCompletion =
  | StartItem
  | Omit<DescriptionItem, 'playerId'>
  | Omit<DrawingItem, 'playerId'>;

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
  taskCompletions: TaskCompletion[];
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

  validateTurn: ({ playerState, turn }) => {
    if (turn.data.taskCompletions.length !== 2) {
      return 'You must complete both tasks. Use the tabs to switch between them!';
    }
    // check that completions match their prompts
    for (let i = 0; i < turn.data.taskCompletions.length; i++) {
      const taskCompletion = turn.data.taskCompletions[i];

      if (!taskCompletion) {
        return 'You must complete both tasks. Use the tabs to switch between them!';
      }

      const prompt = playerState.tasks[i];
      if (taskCompletion.kind === 'description') {
        switch (prompt.kind) {
          case 'start':
            if (prompt.type !== 'description')
              return 'You must complete a description';
          case 'description':
            return 'You must complete a description';
        }
      } else if (taskCompletion.kind === 'drawing') {
        switch (prompt.kind) {
          case 'start':
            if (prompt.type !== 'drawing') return 'You must complete a drawing';
          case 'drawing':
            return 'You must complete a drawing';
        }
      } else {
        return 'Invalid task completion... this is a bug!';
      }

      // check that a description is not empty
      if (taskCompletion.kind === 'description') {
        if (
          !taskCompletion.description ||
          taskCompletion.description.length < 10
        ) {
          return 'Please write something a bit longer.';
        }
      } else if (taskCompletion.kind === 'drawing') {
        if (!taskCompletion.drawing || !taskCompletion.drawing.strokes.length) {
          return 'Please draw something.';
        }
      }
    }
  },

  // run on client

  getProspectivePlayerState: ({ playerId, playerState, prospectiveTurn }) => {
    // match tasks to completions and add them to history
    return {
      ...playerState,
      history: [
        ...playerState.history,
        playerState.tasks.map((task, index) => [
          task,
          { playerId, ...prospectiveTurn.data.taskCompletions[index] },
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
        sequences[seqIndex].push(
          taskCompletionToSequenceItem(
            turn.data.taskCompletions[i],
            turn.playerId,
          ),
        );
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

function taskCompletionToSequenceItem(
  taskCompletion: TaskCompletion,
  playerId: PrefixedId<'u'>,
): SequenceItem {
  if (taskCompletion.kind === 'drawing') {
    return {
      ...taskCompletion,
      playerId,
    };
  } else if (taskCompletion.kind === 'description') {
    return {
      ...taskCompletion,
      playerId,
    };
  } else {
    return taskCompletion;
  }
}
