import { describe, expect, it } from 'vitest';
import {
  findCoordFromCard,
  getAdjacentCardInstanceIds,
  getAllBoardCoordinates,
  getBackRowCoords,
  getCardIdsFromBoard,
  getGatesCoord,
  getSpecialSpaces,
  getStack,
  getTopCard,
  removeTopCard,
  swapCardPositions,
  validCoordinate,
} from './board';
import { CardStack } from '../gameDefinition';
import { generateInitialGameState } from './generate';
import { GameRandom } from '@long-game/game-definition';
import { deckDefinitions } from '../definitions/decks';

describe('gameState/board', {}, () => {
  describe('getTopCard', {}, () => {
    it('returns null if stack is empty', () => {
      const stack: CardStack = [];
      const result = getTopCard(stack);
      expect(result).toBeNull();
    });

    it('returns the top card if stack is not empty', () => {
      const stack: CardStack = ['id1', 'id2', 'id3'];
      const result = getTopCard(stack);
      expect(result).toBe('id3');
    });
  });

  describe('validCoordinate', {}, () => {
    it('returns false for out of bounds coordinates', () => {
      const board = [
        [[], []],
        [[], []],
      ];
      const coord = { x: 2, y: 1 };
      const result = validCoordinate(board, coord);
      expect(result).toBe(false);
    });

    it('returns true for valid coordinates', () => {
      const board = [
        [[], []],
        [[], []],
      ];
      const coord = { x: 1, y: 0 };
      const result = validCoordinate(board, coord);
      expect(result).toBe(true);
    });
  });

  describe('getStack', {}, () => {
    it('throws an error for out of bounds coordinates', () => {
      const board = [
        [[], []],
        [[], []],
      ];
      const coord = { x: 2, y: 1 };
      expect(() => getStack(board, coord)).toThrow('Out of bounds');
    });

    it('returns the stack at the given coordinates', () => {
      const board = [
        [['id1'], ['id2']],
        [['id3'], ['id4']],
      ];
      const coord = { x: 1, y: 0 };
      const result = getStack(board, coord);
      expect(result).toEqual(['id2']);
    });
  });

  describe('removeTopCard', {}, () => {
    it('removes the top card from the stack at the given coordinates', () => {
      const board = [
        [['id1'], ['id2']],
        [['id3'], ['id4']],
      ];
      const coord = { x: 0, y: 0 };
      const result = removeTopCard(board, coord);
      expect(result).toEqual([
        [[], ['id2']],
        [['id3'], ['id4']],
      ]);
    });
  });

  describe('getBackRowCoords', {}, () => {
    it('returns the correct coordinates for the top side', () => {
      const result = getBackRowCoords('top');
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ]);
    });

    it('returns the correct coordinates for the bottom side', () => {
      const result = getBackRowCoords('bottom');
      expect(result).toEqual([
        { x: 0, y: 2 },
        { x: 2, y: 2 },
      ]);
    });
  });

  describe('getGatesCoord', {}, () => {
    it('returns the correct coordinates for the top side', () => {
      const result = getGatesCoord('top');
      expect(result).toEqual({ x: 1, y: 0 });
    });

    it('returns the correct coordinates for the bottom side', () => {
      const result = getGatesCoord('bottom');
      expect(result).toEqual({ x: 1, y: 2 });
    });
  });

  describe('getSpecialSpaces', {}, () => {
    it('returns the correct special spaces for the top side', () => {
      const members = [{ id: 'u-1' }, { id: 'u-2' }];
      const gameState = generateInitialGameState({
        members,
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck1'],
          'u-2': deckDefinitions['deck1'],
        },
      });
      const result = getSpecialSpaces(
        gameState,
        members.map((m) => m.id),
      );
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "coordinate": {
              "x": 0,
              "y": 0,
            },
            "ownerId": "u-1",
            "type": "backRow",
          },
          {
            "coordinate": {
              "x": 2,
              "y": 0,
            },
            "ownerId": "u-1",
            "type": "backRow",
          },
          {
            "coordinate": {
              "x": 1,
              "y": 0,
            },
            "ownerId": "u-1",
            "type": "gate",
          },
          {
            "coordinate": {
              "x": 0,
              "y": 2,
            },
            "ownerId": "u-2",
            "type": "backRow",
          },
          {
            "coordinate": {
              "x": 2,
              "y": 2,
            },
            "ownerId": "u-2",
            "type": "backRow",
          },
          {
            "coordinate": {
              "x": 1,
              "y": 2,
            },
            "ownerId": "u-2",
            "type": "gate",
          },
        ]
      `);
    });
  });

  describe('getCardIdsFromBoard', {}, () => {
    it('returns an empty array for an empty board', () => {
      const board: CardStack[][] = [
        [[], []],
        [[], []],
      ];
      const result = getCardIdsFromBoard(board);
      expect(result).toEqual([]);
    });

    it('returns the correct card IDs from the board', () => {
      const board: CardStack[][] = [
        [['id1'], ['id2']],
        [['id3'], ['id4', 'id5']],
      ];
      const result = getCardIdsFromBoard(board);
      expect(result).toEqual(['id1', 'id2', 'id3', 'id4', 'id5']);
    });
  });

  describe('getAdjacentCardInstanceIds', {}, () => {
    it('returns the correct adjacent card instance IDs', () => {
      const board: CardStack[][] = [
        [['id1'], ['id2'], ['id3']],
        [['id4'], ['id5'], ['id6']],
        [['id7'], ['id8'], ['id9']],
      ];
      const coord = { x: 1, y: 0 };
      const result = getAdjacentCardInstanceIds(board, coord);
      expect(result).toEqual(['id1', 'id3', 'id5']);
    });
  });

  describe('swapCardPositions', {}, () => {
    it('swaps the positions of two cards on the board', () => {
      const board: CardStack[][] = [
        [['id1'], ['id2']],
        [['id3'], ['id4']],
      ];
      const coord1 = { x: 0, y: 0 };
      const coord2 = { x: 1, y: 1 };
      const result = swapCardPositions(board, coord1, coord2);
      expect(result).toEqual([
        [['id4'], ['id2']],
        [['id3'], ['id1']],
      ]);
    });
  });

  describe('findCoordFromCard', {}, () => {
    it('returns the correct coordinates for a card', () => {
      const board: CardStack[][] = [
        [['id1'], ['id2']],
        [['id3'], ['id4']],
      ];
      const cardInstanceId = 'id3';
      const result = findCoordFromCard(board, cardInstanceId);
      expect(result).toEqual({ x: 0, y: 1 });
    });

    it('returns null if the card is not found', () => {
      const board: CardStack[][] = [
        [['id1'], ['id2']],
        [['id3'], ['id4']],
      ];
      const cardInstanceId = 'id5';
      const result = findCoordFromCard(board, cardInstanceId);
      expect(result).toBeNull();
    });
  });

  describe('getAllBoardCoordinates', {}, () => {
    it('returns all coordinates on the board', () => {
      const board: CardStack[][] = [
        [[], []],
        [[], []],
      ];
      const result = getAllBoardCoordinates(board);
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);
    });
  });
});
