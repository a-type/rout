/**
 * The problem:
 *
 * Given N players and M sequences, we want to create
 * two orderings of the sequences for each player...
 */

import { GameRandom } from '@long-game/game-definition';

export type SequenceItemAction = 'draw' | 'describe' | 'skip';
export type SequenceItem = {
  action: SequenceItemAction;
  playerId: string;
};

// ignore above stuff, this is the real algo
export function getSequences({
  random,
  members,
}: {
  random: GameRandom;
  members: { id: string }[];
}) {
  const sequenceCount = Math.max(6, members.length * 2) / 2;
  const roundCount = sequenceCount * 2 * 6;
  // A and B sequence groups: we split sequences evenly
  // and offset B by 1 round so that you're always prompting
  // and drawing in the same round (after the first one at least)
  const sequencesA: string[][] = Array.from({
    length: sequenceCount,
  })
    .fill(null)
    .map(() => []);
  const sequencesB: string[][] = Array.from({
    length: sequenceCount,
  })
    .fill(null)
    .map(() => []);

  // evenly distribute ids into the first positions of all sequences
  const shuffledMembers = random.shuffle(members.map((m) => m.id));
  for (let i = 0; i < sequenceCount; i++) {
    sequencesA[i][0] = shuffledMembers[i % members.length];
    sequencesB[i][0] = shuffledMembers[(i + 1) % members.length];
  }

  for (let j = 1; j < roundCount - 1; j++) {
    for (let i = 0; i < sequenceCount; i++) {
      // continue for the rest of the rounds - 1 with a pattern of "diagonal"
      // distribution of ids into the sequences
      sequencesA[i][j] =
        sequencesA[(i - 1 + sequenceCount) % sequenceCount][j - 1];
      sequencesB[i][j] =
        sequencesB[(i - 1 + sequenceCount) % sequenceCount][j - 1];
    }
  }

  // do one final round on A sequences
  for (let i = 0; i < sequenceCount; i++) {
    sequencesA[i][roundCount - 1] =
      sequencesA[(i + roundCount - 1) % sequenceCount][roundCount - 2];
  }

  // map the rounds to actions
  const orderingsA = sequencesA.map(sequenceToActions);
  const orderingsB = sequencesB.map(sequenceToActions);
  // add an empty item to the start of B sequences
  orderingsB.forEach((ordering) =>
    ordering.unshift({
      action: 'skip',
      playerId: '',
    }),
  );

  // finally, shuffle all the sequences together...
  return random.shuffle([...orderingsA, ...orderingsB]);
}

function sequenceToActions(seq: string[]): SequenceItem[] {
  return seq.map((id, i) => {
    const action = i % 2 === 0 ? 'describe' : 'draw';
    return { action, playerId: id };
  });
}
