import { describe, expect, it } from 'vitest';
import { getDraftingRound } from './rounds';

describe('getDraftingRound', () => {
  it.each([
    // pass left
    [0, 1, true],
    [1, null, false],
    [2, null, false],
    [3, null, false],
    // ...
    // pass right
    [52, 2, true],
    [53, null, false],
    // ...
    // skip draft
    [104, null, true],
    // ...
    // pass left
    [155, 1, true],
    [156, null, false],
    // ...
    // pass right
    [207, 2, true],
    // skip pass
    [259, null, true],
    // ...
    [310, 1, true],
  ])('getDraftingRound(3, %i)', (roundIndex, offset, newDeal) => {
    expect(getDraftingRound(3, roundIndex)).toEqual({
      passOffset: offset,
      isNewDeal: newDeal,
    });
  });
  it.each([
    // pass left
    [0, 1, true],
    [1, null, false],
    [2, null, false],
    // ...
    // pass right
    [53, 2, true],
    [54, null, false],
    // ...
    // pass across
    [106, 3, true],
    [107, null, false],
    // ...
    // skip draft
    [159, null, true],
    // ...
    // pass left
    [211, 1, true],
    [212, null, false],
  ])('getDraftingRound(4, %i)', (roundIndex, offset, newDeal) => {
    expect(getDraftingRound(4, roundIndex)).toEqual({
      passOffset: offset,
      isNewDeal: newDeal,
    });
  });
  it.each([
    // pass left
    [0, 1, true],
    [1, null, false],
    [2, null, false],
    // ...
    // pass right
    [51, 2, true],
    [52, null, false],
    // ...
    // pass across 1
    [102, 3, true],
    [103, null, false],
    // ...
    // pass across 2
    [153, 4, true],
    [154, null, false],
    // ...
    // skip draft
    [204, null, true],
    // ...
    // pass left
    [254, 1, true],
  ])('getDraftingRound(5, %i)', (roundIndex, offset, newDeal) => {
    expect(getDraftingRound(5, roundIndex)).toEqual({
      passOffset: offset,
      isNewDeal: newDeal,
    });
  });
});
