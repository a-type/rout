import { GameRound, clone } from '@long-game/common';
import {
  TurnData,
  gameDefinition,
  getPromptSequenceIndexes,
} from './gameDefinition.js';
import { describe, it, expect } from 'vitest';
import { GameRandom, Turn } from '@long-game/game-definition';

describe('scribble game logic helpers', () => {
  describe('prompt sequence indexes', () => {
    it('alternates indexes for 3 players', () => {
      const members = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const sequenceCount = 9;
      // first round and second round have the same sequence
      // indexes, then they begin alternating.
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 0,
          sequenceCount,
        }),
      ).toEqual({
        // describing 0
        toDrawIndex: 0,
        toDescribeIndex: 0,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 0,
          sequenceCount,
        }),
      ).toEqual({
        // describing 3
        toDrawIndex: 3,
        toDescribeIndex: 3,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '3',
          roundIndex: 0,
          sequenceCount,
        }),
      ).toEqual({
        // describing 6
        toDrawIndex: 6,
        toDescribeIndex: 6,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 3 (player 2's prompt)
        toDrawIndex: 3,
        // describing 1 (new)
        toDescribeIndex: 1,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 6 (player 3's prompt)
        toDrawIndex: 6,
        // describing 4 (new)
        toDescribeIndex: 4,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '3',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 0 (player 1's prompt)
        toDrawIndex: 0,
        // describing 7 (new)
        toDescribeIndex: 7,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 2,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 4 (player 2's prompt)
        toDrawIndex: 4,
        // describing 2 (new)
        toDescribeIndex: 2,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 2,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 7 (player 3's prompt)
        toDrawIndex: 7,
        // describing 5 (new)
        toDescribeIndex: 5,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '3',
          roundIndex: 2,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 1 (player 1's prompt)
        toDrawIndex: 1,
        // describing 8 (new)
        toDescribeIndex: 8,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 3,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 5 (player 2's prompt)
        toDrawIndex: 5,
        // describing 3 (new)
        toDescribeIndex: 3,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 3,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 8 (player 3's prompt)
        toDrawIndex: 8,
        // describing 6 (new)
        toDescribeIndex: 6,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '3',
          roundIndex: 3,
          sequenceCount,
        }),
      ).toEqual({
        // drawing 2 (player 1's prompt)
        toDrawIndex: 2,
        // describing 0 (new)
        toDescribeIndex: 0,
      });
    });
  });
});

describe('scribble game definition', () => {
  it('plays 3 players', () => {});
});
