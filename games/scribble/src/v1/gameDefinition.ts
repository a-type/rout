import { GameRound } from '@long-game/common';
import { GameDefinition, Turn, roundFormat } from '@long-game/game-definition';
import { de } from 'date-fns/locale';
import { lazy } from 'react';

/*

Scribble
========

Scribble is a game where players take turns writing descriptions of
images and drawing images based on descriptions.

The first round is for gathering prompts. Each player writes a
prompt for another player to draw. These prompts will be the
"originals" - at the end of the game we'll see how well the
final drawing in their sequence matches up to the original prompt.

The second round is for drawing the original prompts. Each player
draws the prompt they receive, which is different from the one
they wrote the first round.

From there, each round involves describing one drawing, and
drawing one description. Each player will receive a description
from another player and draw it, and write a description for
another player to draw of an image they are given. The image and
description you receive during around don't go together; they
are from different sequences.

The game ends with the final round of drawing, at which point
we will compare the final drawing in each sequence to the
original prompt, and show all the steps it took to get there.
 */

type SequenceItem = {
  description: string;
  illustration: string;
  illustratorId: string;
  describerId: string;
};

export type GlobalState = {
  sequences: SequenceItem[][];
  imageSize: number;
};

type Prompt =
  | {
      type: 'prompt';
    }
  | {
      type: 'draw';
      description: string;
      userId: string;
    }
  | {
      type: 'describe';
      illustration: string;
      userId: string;
    };

export type PlayerState = {
  prompts: Prompt[];
  imageSize: number;
};

type TurnOneData = {
  descriptions: string[];
};
type TurnTwoData = {
  illustrations: string[];
};
type OtherTurnData = {
  description: string;
  illustration: string;
};
export type TurnData = TurnOneData | TurnTwoData | OtherTurnData;

export type PublicTurnData = {};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  PublicTurnData
> = {
  version: 'v1.0',
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ turn, roundIndex, members }) => {
    const sequenceCount = getSequenceCount(members.length);
    const requiredInitialEntries = Math.floor(sequenceCount / members.length);
    if (roundIndex === 0) {
      if (!isTurnOneData(turn.data)) {
        return 'You must provide descriptions for the first round.';
      }
      if (turn.data.descriptions.length !== requiredInitialEntries) {
        return `You must provide ${requiredInitialEntries} descriptions for the first round.`;
      }
    }
    if (roundIndex === 1) {
      if (!isTurnTwoData(turn.data)) {
        return 'You must provide illustrations for the second round.';
      }
      if (turn.data.illustrations.length !== requiredInitialEntries) {
        return `You must provide ${requiredInitialEntries} illustrations for the second round.`;
      }
    }
    if (roundIndex > 1) {
      if (!isOtherTurnData(turn.data)) {
        return 'You must provide a description and illustration for each turn.';
      }
    }
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    return {
      // seed the sequences
      sequences: new Array(getSequenceCount(members.length))
        .fill(null)
        .map(() => []),
      imageSize: 256,
    };
  },

  getPlayerState: ({ globalState, playerId, roundIndex, members }) => {
    const indexes = getPromptSequenceIndexes({
      members,
      playerId,
      roundIndex,
      sequenceCount: globalState.sequences.length,
    });
    const sequenceCount = globalState.sequences.length;
    const prompts: Prompt[] = [];
    if (roundIndex === 0) {
      // nothing to fetch... just send empty prompts
      for (let i = 0; i < Math.floor(sequenceCount / members.length); i++) {
        prompts.push({
          type: 'prompt',
        });
      }
    } else if (roundIndex === 1) {
      // start at illustrationIndex and add until count is reached
      for (let i = 0; i < Math.floor(sequenceCount / members.length); i++) {
        const seq =
          globalState.sequences[
            (indexes.illustrationIndex + i) % sequenceCount
          ];
        const item = getLatest(seq) ?? {
          description:
            "(Whoops, something went wrong and there's no prompt! Draw anything?)",
          describerId: '',
          illustration: '',
          illustratorId: '',
        };
        prompts.push({
          type: 'draw',
          description: item.description,
          userId: item.describerId,
        });
      }
    } else {
      const descriptionSequence =
        globalState.sequences[indexes.descriptionIndex];
      const illustrationSequence =
        globalState.sequences[indexes.illustrationIndex];
      const illustration = getLatest(illustrationSequence);
      prompts.push({
        type: 'describe',
        illustration: illustration?.illustration ?? '',
        userId: illustration?.illustratorId ?? '',
      });
      const description = getLatest(descriptionSequence);
      prompts.push({
        type: 'draw',
        description:
          description?.description ??
          "(Whoops, something went wrong and there's no prompt! Draw anything?)",
        userId: description?.describerId ?? '',
      });
    }

    return {
      prompts,
      imageSize: globalState.imageSize,
    };
  },

  getState: ({ initialState, random, rounds, members }) => {
    return rounds.reduce(
      (globalState, round, roundIndex) =>
        applyMoveToGlobalState(globalState, round, roundIndex, members),
      {
        ...initialState,
      },
    );
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full move data into what players can see
    // (i.e. what should you know about other players' moves?)
    return {
      ...turn,
      data: {},
    };
  },

  getStatus: ({ globalState, rounds, members }) => {
    if (rounds.length >= 10) {
      return {
        status: 'completed',
        // everybody wins
        winnerIds: members.map((m) => m.id),
      };
    }
    return {
      status: 'active',
    };
  },
};

// helper methods
const applyMoveToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Turn<TurnData>>,
  roundIndex: number,
  members: { id: string }[],
): GlobalState => {
  for (const turn of round.turns) {
    const { descriptionIndex, illustrationIndex } = getPromptSequenceIndexes({
      members,
      playerId: turn.userId,
      roundIndex,
      sequenceCount: globalState.sequences.length,
    });
    // when applying a turn, we write the illustration to the
    // description sequence's last item, and the description to the
    // illustration sequence as a new item.
    const descriptionSequence = globalState.sequences[descriptionIndex];
    const illustrationSequence = globalState.sequences[illustrationIndex];

    // this branch isn't used on the first round, where we only
    // have a description
    const turnData = turn.data;
    if (isTurnOneData(turnData)) {
      for (let i = 0; i < turnData.descriptions.length; i++) {
        // starting at player default index and moving to next
        // sequence until entries are exhausted
        const defaultIndex = getPlayerDefaultIndex({
          members,
          playerId: turn.userId,
          sequenceCount: globalState.sequences.length,
        });
        const description = turnData.descriptions[i];
        const seq = globalState.sequences[defaultIndex + i];
        seq.push({
          description,
          describerId: turn.userId,
          illustration: '',
          illustratorId: '',
        });
      }
    } else if (isTurnTwoData(turnData)) {
      for (let i = 0; i < turnData.illustrations.length; i++) {
        const illustration = turnData.illustrations[i];
        const seq = globalState.sequences[illustrationIndex + i];
        // should apply to the first and only item in the sequence
        seq[0].illustration = illustration;
        seq[0].illustratorId = turn.userId;
      }
    } else {
      const itemWeIllustrated = getLatest(descriptionSequence);
      if (!itemWeIllustrated) {
        // idk what happened!
        descriptionSequence.push({
          description: '(Something went wrong here... we lost the description)',
          describerId: '',
          illustration: turnData.illustration ?? '',
          illustratorId: turn.userId,
        });
      } else {
        itemWeIllustrated.illustration = turnData.illustration ?? '';
        itemWeIllustrated.illustratorId = turn.userId;
      }

      illustrationSequence.push({
        description: turnData.description,
        describerId: turn.userId,
        illustration: '',
        illustratorId: '',
      });
    }
  }
  return globalState;
};

// stable index for player even if members list isn't always the
// same order. when the number of sequences is a multiple of the
// number of players, player default index is evenly distributed
// across the sequences.
const getPlayerDefaultIndex = ({
  members,
  playerId,
  sequenceCount,
}: {
  members: { id: string }[];
  playerId: string;
  sequenceCount: number;
}) => {
  const offset = Math.floor(sequenceCount / members.length);
  return (
    members
      .map((m) => m.id)
      .sort()
      .indexOf(playerId) * offset
  );
};

/*

Sequence indexes - a bit tricky. For the prompts we give the player,
we pull from different sequences for description, image. When the player
sends their turn, we write the illustration back to the description
sequence, and we push a new item for their description onto the
illustration sequence.

*/

/**
 * Provides the indexes of the sequences the player should
 * pull from for their description and illustration this round.
 */
export const getPromptSequenceIndexes = ({
  members,
  playerId,
  roundIndex,
  sequenceCount,
}: {
  sequenceCount: number;
  members: { id: string }[];
  playerId: string;
  roundIndex: number;
}) => {
  const playerDefaultIndex = getPlayerDefaultIndex({
    members,
    playerId,
    sequenceCount,
  });
  // rounds 0 and 1 are special. in round 0, we use the default
  // index for description, and we don't do illustrations.
  // in round 1, we do illustrations, starting at the default
  // index of the next player, and we don't do descriptions.
  if (roundIndex === 0) {
    return {
      descriptionIndex: playerDefaultIndex,
      illustrationIndex: playerDefaultIndex,
    };
  } else if (roundIndex === 1) {
    const illustrationIndex =
      (playerDefaultIndex + Math.floor(sequenceCount / members.length)) %
      sequenceCount;
    return { descriptionIndex: illustrationIndex, illustrationIndex };
  }

  const otherRoundsIndex = roundIndex - 2;

  // for other rounds we begin the illustration index at the start of N + 2 player's sequences
  const illustrationIndex =
    (playerDefaultIndex +
      Math.floor(sequenceCount / members.length) * 2 +
      otherRoundsIndex) %
    sequenceCount;
  const descriptionIndex = (illustrationIndex + 1) % sequenceCount;
  return { descriptionIndex, illustrationIndex };
};

const getLatest = <T>(arr: T[]): T | undefined => {
  return arr[arr.length - 1];
};

function isTurnOneData(data: TurnData): data is TurnOneData {
  return (data as TurnOneData).descriptions !== undefined;
}

function isTurnTwoData(data: TurnData): data is TurnTwoData {
  return (data as TurnTwoData).illustrations !== undefined;
}

function isOtherTurnData(data: TurnData): data is OtherTurnData {
  return (data as OtherTurnData).description !== undefined;
}

function getSequenceCount(memberCount: number) {
  if (memberCount < 3) {
    return memberCount * 3;
  }
  if (memberCount < 6) {
    return memberCount * 2;
  }
  return memberCount;
}
