import { PrefixedId } from '@long-game/common';
import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { getPlayerSequenceIndexes } from './ordering';

const PROMPT_ROUNDS = 8;
const RATING_ROUND = PROMPT_ROUNDS + 1;

export type ItemKey = `${number}-${number}`;

export interface Rating {
  key: ItemKey;
  playerId: PrefixedId<'u'>;
  rating: 'accurate' | 'funny' | 'talented' | 'perplexing';
}

export interface DescriptionItem {
  kind: 'description';
  description: string;
  playerId: PrefixedId<'u'>;
  ratings?: Rating[];
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
  ratings?: Rating[];
}

export interface StartItem {
  kind: 'start';
  type: 'drawing' | 'description';
}

export type SequenceItem = StartItem | DescriptionItem | DrawingItem;

export interface RatingAssignment {
  prompt: DescriptionItem | DrawingItem;
  completion: DescriptionItem | DrawingItem;
  key: ItemKey;
}

export interface RatingTask {
  kind: 'ratings';
  // a number of pairs of tasks and completions the user should rate
  tasksToRate: RatingAssignment[];
}

export type Task = SequenceItem | RatingTask;

export interface RatingCompletion {
  kind: 'ratings-completion';
  ratings: Omit<Rating, 'playerId'>[];
}

export type TaskCompletion =
  | Omit<DescriptionItem, 'playerId' | 'id'>
  | Omit<DrawingItem, 'playerId' | 'id'>
  | RatingCompletion;

export type GlobalState = {
  sequences: SequenceItem[][];
};

export type PlayerState = {
  tasks: Task[];
  // converted to sequence items to make them easier to render generically
  submitted?: TaskCompletion[];
};

export type TurnData = {
  taskCompletions: TaskCompletion[];
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  {}
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn, roundIndex }) => {
    if (turn.data.taskCompletions.length !== 2 && roundIndex < RATING_ROUND) {
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
              return 'You must provide a starting prompt';
            break;
          case 'description':
            return 'You must complete a description';
        }
      } else if (taskCompletion.kind === 'drawing') {
        switch (prompt.kind) {
          case 'start':
            if (prompt.type !== 'drawing')
              return 'You must provide a starting drawing';
            break;
          case 'drawing':
            return 'You must complete a drawing';
        }
      } else if (taskCompletion.kind === 'ratings-completion') {
        // number of ratings should equal the number of tasks to rate
        const task = prompt as RatingTask;
        if (task.tasksToRate.length !== taskCompletion.ratings.length) {
          return 'You must rate every item.';
        }
        // check that keys match
        for (let i = 0; i < taskCompletion.ratings.length; i++) {
          const rating = taskCompletion.ratings[i];
          if (rating.key !== task.tasksToRate[i].key) {
            return `Invalid key: ${rating.key}`;
          }
        }
        // check that the ratings are valid
        for (const rating of taskCompletion.ratings) {
          if (
            !['accurate', 'funny', 'talented', 'perplexing'].includes(
              rating.rating,
            )
          ) {
            return `Invalid rating: ${rating.rating}`;
          }
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
      submitted: prospectiveTurn.data.taskCompletions.filter(
        (c) => c && c.kind !== 'ratings-completion',
      ),
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

  getPlayerState: ({
    globalState,
    playerId,
    playerTurn,
    members,
    roundIndex,
  }) => {
    const playerIndex = members.findIndex((member) => member.id === playerId);
    if (roundIndex === RATING_ROUND) {
      // in this final round we give the player a list of tasks to rate
      const tasksToRate: RatingAssignment[] = [];
      // basically just all the prompts this player made, and their completions
      for (let i = 0; i < roundIndex - 1; i++) {
        const indexes = getPlayerSequenceIndexes({
          sequenceCount: globalState.sequences.length,
          roundIndex: i,
          playerIndex,
        });
        for (const seqIndex of indexes) {
          const sequence = globalState.sequences[seqIndex];
          const prompt = sequence[i];
          if (prompt.kind === 'description' || prompt.kind === 'drawing') {
            const completion = sequence[i + 1];
            if (
              completion.kind === 'description' ||
              completion.kind === 'drawing'
            ) {
              tasksToRate.push({
                prompt,
                completion,
                key: `${seqIndex}-${i + 1}`,
              });
            }
          }
        }
      }
      return {
        tasks: [
          {
            kind: 'ratings',
            tasksToRate,
          },
        ],
        submitted: playerTurn?.data.taskCompletions,
      };
    }

    const indexes = getPlayerSequenceIndexes({
      sequenceCount: globalState.sequences.length,
      roundIndex,
      playerIndex,
    });
    // player's tasks are the latest prompts from each sequence they are assigned this round
    const tasks = indexes.map((seqIndex) => {
      const sequencePrompt = globalState.sequences[seqIndex][roundIndex];
      return sequencePrompt;
    });

    const submitted = playerTurn?.data.taskCompletions;

    return {
      tasks,
      submitted,
    };
  },

  applyRoundToGlobalState: ({
    globalState,
    round,
    roundIndex,
    members,
    random,
  }) => {
    const sequences = [...globalState.sequences];

    if (roundIndex === RATING_ROUND) {
      round.turns.forEach((turn) => {
        const completion = turn.data.taskCompletions[0];
        if (completion.kind !== 'ratings-completion') {
          throw new Error('Expected ratings completion for the ratings round');
        }
        // assign ratings to the item they are rating
        for (const rating of completion.ratings) {
          const { sequenceIndex, itemIndex } = parseItemKey(rating.key);
          const sequence = sequences[sequenceIndex];
          const item = sequence[itemIndex];
          if (item.kind === 'description' || item.kind === 'drawing') {
            item.ratings ??= [];
            item.ratings.push({
              ...rating,
              playerId: turn.playerId,
            });
          }
        }
      });
      return {
        ...globalState,
        sequences,
      };
    }

    // add the new turn to the sequences
    round.turns.forEach((turn) => {
      const playerIndex = members.findIndex(
        (member) => member.id === turn.playerId,
      );
      const sequenceIndexes = getPlayerSequenceIndexes({
        sequenceCount: globalState.sequences.length,
        roundIndex: roundIndex,
        playerIndex,
      });
      sequenceIndexes.forEach((seqIndex, i) => {
        const completion = turn.data.taskCompletions[i];
        if (completion.kind === 'ratings-completion') {
          throw new Error('Ratings completion should not be here');
        } else {
          sequences[seqIndex].push(
            taskCompletionToSequenceItem(completion, turn.playerId),
          );
        }
      });
    });

    return {
      ...globalState,
      sequences,
    };
  },

  getPublicTurn: ({ turn }) => {
    return {
      ...turn,
      data: {},
    };
  },

  getStatus: ({ globalState, rounds }) => {
    if (rounds.length > RATING_ROUND) {
      return {
        status: 'completed',
        winnerIds: [],
      };
    }
    return {
      status: 'active',
    };
  },
};

function taskCompletionToSequenceItem(
  taskCompletion: Exclude<TaskCompletion, RatingCompletion>,
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

function parseItemKey(key: ItemKey): {
  sequenceIndex: number;
  itemIndex: number;
} {
  const [sequenceIndex, itemIndex] = key.split('-').map(Number);
  return {
    sequenceIndex,
    itemIndex,
  };
}
