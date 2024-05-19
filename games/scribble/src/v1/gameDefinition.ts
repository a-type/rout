import { GameRound } from '@long-game/common';
import { GameDefinition, Turn, roundFormat } from '@long-game/game-definition';
import { de } from 'date-fns/locale';
import { lazy } from 'react';
import { OrderingItem, getOrderings } from './orderings.js';

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
  // pre-determined game ordering
  orderings: OrderingItem[][];
  // actual items created by players
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

type PromptResponse =
  | {
      type: 'description';
      value: string;
    }
  | {
      type: 'illustration';
      value: string;
    };
export type TurnData = {
  promptResponses: PromptResponse[];
};

export type PublicTurnData = {};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  PublicTurnData
> = {
  version: 'v1.0',
  minimumPlayers: 3,
  maximumPlayers: 9,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ turn, roundIndex, members }) => {
    if (roundIndex === 0) {
      if (
        turn.data.promptResponses.length !== 1 ||
        turn.data.promptResponses[0].type !== 'description'
      ) {
        return `You must provide 1 prompt for the first round.`;
      }
    }
    if (roundIndex >= 1) {
      if (turn.data.promptResponses.length !== 2) {
        return `You must provide 1 prompt and 1 illustration for this round.`;
      }
      if (
        turn.data.promptResponses.filter((r) => r.type === 'illustration')
          .length !== 1
      ) {
        return `You must provide 1 illustration for this round.`;
      }
      if (
        turn.data.promptResponses.filter((r) => r.type === 'description')
          .length !== 1
      ) {
        return `You must provide 1 description for this round.`;
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

  getInitialGlobalState: ({ members, random }) => {
    return {
      orderings: getOrderings({ random, members }),
      // seed the sequences
      sequences: new Array(getSequenceCount(members.length))
        .fill(null)
        .map(() => []),
      imageSize: 256,
    };
  },

  getPlayerState: ({ globalState, playerId, roundIndex, members }) => {
    // get the orderings for this round and find this player's actions
    const orderings = globalState.orderings;
    const thisRoundsOrderings = orderings.map((o, i) => ({
      sequenceIndex: i,
      ...o[roundIndex],
    }));
    const thisPlayersOrderings = thisRoundsOrderings.filter(
      (o) => o.playerId === playerId,
    );

    const prompts: Prompt[] = [];

    for (const o of thisPlayersOrderings) {
      switch (o.action) {
        case 'describe':
          // if there's no illustration, this is a 'prompt'
          const illustration =
            globalState.sequences[o.sequenceIndex][roundIndex - 1]
              ?.illustration;
          if (illustration) {
            prompts.push({
              type: 'describe',
              illustration,
              userId: playerId,
            });
          } else {
            prompts.push({
              type: 'prompt',
            });
          }
          break;
        case 'draw':
          // if there's no description, something went wrong.
          const description =
            globalState.sequences[o.sequenceIndex][roundIndex - 1]?.description;
          if (description) {
            prompts.push({
              type: 'draw',
              description:
                globalState.sequences[o.sequenceIndex][roundIndex - 1]
                  .description,
              userId: playerId,
            });
          }
          break;
        case 'skip':
          break;
      }
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
    const maxOrdering = Math.max(...globalState.orderings.map((o) => o.length));
    const maxSequenceLength = Math.max(
      ...globalState.sequences.map((s) => s.length),
    );
    if (maxSequenceLength >= maxOrdering) {
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
    const { toDrawIndex, toDescribeIndex } = getPromptSequenceIndexes({
      members,
      playerId: turn.userId,
      roundIndex,
      sequenceCount: globalState.sequences.length,
    });
    // when applying a turn, we write the illustration to the
    // description sequence's last item, and the description to the
    // illustration sequence as a new item.
    const sequenceWeDrew = globalState.sequences[toDrawIndex];
    const sequenceWeDescribed = globalState.sequences[toDescribeIndex];

    const turnData = turn.data;
    for (const promptResponse of turnData.promptResponses) {
      if (promptResponse.type === 'description') {
        sequenceWeDescribed.push({
          description: promptResponse.value,
          describerId: turn.userId,
          illustration: '',
          illustratorId: '',
        });
      } else {
        const itemWeDrew = getLatest(sequenceWeDrew);
        if (!itemWeDrew) {
          // idk what happened!
          sequenceWeDrew.push({
            description:
              '(Something went wrong here... we lost the description)',
            describerId: '',
            illustration: promptResponse.value ?? '',
            illustratorId: turn.userId,
          });
        } else {
          itemWeDrew.illustration = promptResponse.value ?? '';
          itemWeDrew.illustratorId = turn.userId;
        }
      }
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
  // rounds 0 is special. in round 0, we use the default
  // index for description, and we don't do illustrations.
  if (roundIndex === 0) {
    return {
      toDescribeIndex: playerDefaultIndex,
      toDrawIndex: playerDefaultIndex,
    };
  }

  // with 2 players, we need to jump back once more after the
  // initial prompting rounds are complete so that we are
  // describing the drawings of the other player on our own
  // prompts, not describing our own drawings on their prompts.
  const special2PlayerCase =
    members.length === 2 &&
    roundIndex >= Math.floor(sequenceCount / members.length);
  const specialDescribeOffset = special2PlayerCase
    ? Math.floor(sequenceCount / members.length)
    : 0;
  // describe along the normal track of your own sequence region
  const toDescribeIndex =
    (playerDefaultIndex + roundIndex + specialDescribeOffset) % sequenceCount;
  // start drawing in N+1 player's sequence region
  const toDrawIndex =
    (playerDefaultIndex +
      Math.floor(sequenceCount / members.length) +
      roundIndex -
      1) %
    sequenceCount;
  return { toDrawIndex, toDescribeIndex };
};

const getLatest = <T>(arr: T[]): T | undefined => {
  return arr[arr.length - 1];
};

function getSequenceCount(memberCount: number) {
  if (memberCount < 3) {
    return memberCount * 3;
  }
  if (memberCount < 6) {
    return memberCount * 2;
  }
  return memberCount;
}
