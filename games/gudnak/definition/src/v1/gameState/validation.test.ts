import { describe, expect, it } from 'vitest';
import {
  INVALID_DEPLOY_CODES,
  INVALID_MOVE_CODES,
  validateDeploy,
  validateMove,
} from './validation';
import { generateInitialGameState } from './generate';
import { GameRandom } from '@long-game/game-definition';
import { addCardToStack } from './board';
import { deckDefinitions } from '../definitions/decks';

describe('gameState/validation', {}, () => {
  describe('validateDeploy', {}, () => {
    it('should validate a deploy action', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': { name: 'test', list: ['dawnbringer-brute-1'] },
        },
      });
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      const action = {
        type: 'deploy',
        cardInstanceId: 'card-1',
        target: { x: 0, y: 0 },
      };
      const result = validateDeploy(
        gameState.board,
        gameState.cardState,
        'top',
        gameState.cardState['card-1'],
        action.target,
      );
      expect(result).toBeNull();
    });

    it('should return an error if the target is not a valid deploy space', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': { name: 'test', list: ['dawnbringer-brute-1'] },
        },
      });
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      const action = {
        type: 'deploy',
        cardInstanceId: 'card-1',
        target: { x: 1, y: 1 },
      };
      const result = validateDeploy(
        gameState.board,
        gameState.cardState,
        'top',
        gameState.cardState['card-1'],
        action.target,
      );
      expect(result).not.toBeNull();
      expect(result).toContain(INVALID_DEPLOY_CODES.INVALID_SPACE);
    });

    it('should return an error if the target is not a matching tag', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['dawnbringer-brute-1', 'dusklight-hunter-1'],
          },
        },
      });
      gameState.board = addCardToStack(
        gameState.board,
        { x: 0, y: 0 },
        'card-1',
      );
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      gameState.cardState['card-2'] = {
        cardId: 'dusklight-hunter-1',
        instanceId: 'card-2',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      const action = {
        type: 'deploy',
        cardInstanceId: 'card-2',
        target: { x: 0, y: 0 },
      };
      const result = validateDeploy(
        gameState.board,
        gameState.cardState,
        'top',
        gameState.cardState['card-2'],
        action.target,
      );
      expect(result).not.toBeNull();
      expect(result).toContain(INVALID_DEPLOY_CODES.NO_MATCHING_TAG);
    });
  });

  describe('validateMove', {}, () => {
    it('should validate a move action', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck-1'],
        },
      });
      gameState.board = addCardToStack(
        gameState.board,
        { x: 0, y: 0 },
        'card-1',
      );
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      const action = {
        type: 'move',
        cardInstanceId: 'card-1',
        source: { x: 0, y: 0 },
        target: { x: 1, y: 0 },
      };
      const result = validateMove(
        gameState.board,
        'u-1',
        gameState.cardState,
        gameState.cardState['card-1'],
        action.source,
        action.target,
      );
      expect(result).toBeNull();
    });

    it('should return an error if the target is owned by same player', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }, { id: 'u-2' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck-1'],
          'u-2': deckDefinitions['deck-1'],
        },
      });
      gameState.board = addCardToStack(
        gameState.board,
        { x: 0, y: 0 },
        'card-1',
      );
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      gameState.board = addCardToStack(
        gameState.board,
        { x: 0, y: 1 },
        'card-1',
      );
      gameState.cardState['card-2'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-2',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      const action = {
        type: 'move',
        cardInstanceId: 'card-1',
        source: { x: 0, y: 0 },
        target: { x: 0, y: 1 },
      };
      const result = validateMove(
        gameState.board,
        'u-1',
        gameState.cardState,
        gameState.cardState['card-1'],
        action.source,
        action.target,
      );
      expect(result).not.toBeNull();
      expect(result).toContain(INVALID_MOVE_CODES.SAME_OWNER);
    });

    it('should return error if move is not orthogonal', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck-1'],
        },
      });
      gameState.board[0][0].push('card-1');
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: false,
        continuousEffects: [],
      };
      const action = {
        type: 'move',
        cardInstanceId: 'card-1',
        source: { x: 0, y: 0 },
        target: { x: 2, y: 2 },
      };
      const result = validateMove(
        gameState.board,
        'u-1',
        gameState.cardState,
        gameState.cardState['card-1'],
        action.source,
        action.target,
      );
      expect(result).not.toBeNull();
      expect(result).toContain(INVALID_MOVE_CODES.NOT_ADJACENT);
    });

    it('should return error if card is fatigued', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck-1'],
        },
      });
      gameState.board = addCardToStack(
        gameState.board,
        { x: 0, y: 0 },
        'card-1',
      );
      gameState.cardState['card-1'] = {
        cardId: 'dawnbringer-brute-1',
        instanceId: 'card-1',
        ownerId: 'u-1',
        fatigued: true,
        continuousEffects: [],
      };
      const action = {
        type: 'move',
        cardInstanceId: 'card-1',
        source: { x: 0, y: 0 },
        target: { x: 1, y: 0 },
      };
      const result = validateMove(
        gameState.board,
        'u-1',
        gameState.cardState,
        gameState.cardState['card-1'],
        action.source,
        action.target,
      );
      expect(result).not.toBeNull();
      expect(result).toContain(INVALID_MOVE_CODES.FATIGUED);
    });
  });
});
