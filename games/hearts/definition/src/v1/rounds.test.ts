import { describe, expect, it } from 'vitest';
import { getDraftingRound } from './rounds';

describe('getDraftingRound', () => {
  it.each([
    [0, 0],
    [1, null],
    [2, null],
    [3, null],
    // ...
    [18, 1],
    [19, null],
    // ...
    [35, null],
    [36, 2],
    [37, null],
    [38, null],
    // ...
    [53, 3],
    [71, 4],
  ])('getDraftingRound(3, %i)', (roundIndex, expected) => {
    expect(getDraftingRound(3, roundIndex)).toBe(expected);
  });
});
