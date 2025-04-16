import { describe, expect, it } from 'vitest';
import { getPlayerSequenceIndexes } from './ordering';

describe('player sequence ordering', () => {
  it.each([
    {
      sequenceCount: 4,
      roundIndex: 0,
      playerIndex: 0,
      expected: [0, 1],
    },
    {
      sequenceCount: 4,
      roundIndex: 0,
      playerIndex: 1,
      expected: [2, 3],
    },
    {
      sequenceCount: 4,
      roundIndex: 1,
      playerIndex: 0,
      expected: [2, 3],
    },
    {
      sequenceCount: 4,
      roundIndex: 1,
      playerIndex: 1,
      expected: [0, 1],
    },
    {
      sequenceCount: 8,
      roundIndex: 0,
      playerIndex: 3,
      expected: [6, 7],
    },
    {
      sequenceCount: 8,
      roundIndex: 3,
      playerIndex: 0,
      expected: [6, 7],
    },
  ])(
    '(seq: $sequenceCount, player: $playerIndex, round: $roundIndex) should produce a sequence in which players never describe their own drawing or draw their own description',
    (args) => {
      expect(getPlayerSequenceIndexes(args)).toEqual(args.expected);
    },
  );
});
