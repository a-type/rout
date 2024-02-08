import { GameRandom } from '@long-game/game-definition';
import { describe, expect, it } from 'vitest';
import { getOrderings } from './orderings.js';

describe('sequence generation', () => {
  it('should generate prompt/draw sequences and describe sequences that follow the rules', () => {
    // the rules:
    // 1. you should never draw something that hasn't been prompted or
    //    described previously
    // 2. you should never describe a drawing that hasn't been drawn yet
    // 3. you should never describe your own drawing
    // 4. you should never draw your own prompt/description

    const random = new GameRandom('test');
    const members = [
      { id: 'a' },
      { id: 'c' },
      { id: 'b' },
      { id: 'e' },
      { id: 'd' },
    ];

    const sequences = getOrderings({
      random,
      members,
    });

    for (let round = 0; round < sequences[0].length; round++) {
      for (let seqIdx = 0; seqIdx < sequences.length; seqIdx++) {
        const cur = sequences[seqIdx][round];
        if (round > 0) {
          const prev = sequences[seqIdx][round - 1];
          // 1: never doing the same action in a row on a sequence
          expect(prev.action).not.toBe(cur.action);
          // 3 / 4: different player from previous round
          expect(prev.playerId).not.toBe(cur.playerId);

          if (prev.action === 'skip') {
            // 2: first round is never draw
            expect(cur.action).not.toBe('draw');
          }
        } else {
          // 2: first round is never draw.
          expect(cur.action).not.toBe('draw');
        }
      }
    }
  });
});
