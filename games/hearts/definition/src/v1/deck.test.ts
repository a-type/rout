import { GameRandom } from '@long-game/game-definition';
import { describe, expect, it } from 'vitest';
import { shuffleHands } from './deck';
import { fivePlayerDeck, fullDeck, threePlayerDeck } from './gameDefinition';

describe('shuffling the deck', () => {
  describe('3 player game', () => {
    it('should shuffle the deck but not remove any cards', () => {
      const hands = shuffleHands({
        random: new GameRandom('seed'),
        members: [{ id: 'u-1' }, { id: 'u-2' }, { id: 'u-3' }],
      });

      const cards = Object.values(hands).flat();
      expect(cards.length).toBe(threePlayerDeck.length);
    });
  });

  describe('4 player game', () => {
    it('should shuffle the deck but not remove any cards', () => {
      const hands = shuffleHands({
        random: new GameRandom('seed'),
        members: [{ id: 'u-1' }, { id: 'u-2' }, { id: 'u-3' }, { id: 'u-4' }],
      });

      const cards = Object.values(hands).flat();
      expect(cards.length).toBe(fullDeck.length);
    });
  });

  describe('5 player game', () => {
    it('should shuffle the deck but not remove any cards', () => {
      const hands = shuffleHands({
        random: new GameRandom('seed'),
        members: [
          { id: 'u-1' },
          { id: 'u-2' },
          { id: 'u-3' },
          { id: 'u-4' },
          { id: 'u-5' },
        ],
      });

      const cards = Object.values(hands).flat();
      expect(cards.length).toBe(fivePlayerDeck.length);
    });
  });
});
