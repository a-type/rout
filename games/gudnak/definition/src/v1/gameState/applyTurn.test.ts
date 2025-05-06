import { describe, it, expect } from 'vitest';
import { applyTurn } from './applyTurn';
import { generateInitialGameState } from './generate';
import { GameRandom, Turn } from '@long-game/game-definition';
import { TurnData } from '../gameDefinition';
import { deckDefinitions } from '../definitions/decks';
import { clearAllFatigue, deploy, nextActivePlayer } from './gameStateHelpers';
import { getStack, getTopCard } from './board';

describe('applyTurn', () => {
  describe('draw', () => {
    it('should draw a card from the deck', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck1'],
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'draw',
          },
        },
      };
      expect(gameState.playerState[playerId].hand).toHaveLength(5);
      expect(gameState.actions).toBe(2);
      gameState = applyTurn(gameState, turn);
      expect(gameState.playerState[playerId].hand).toHaveLength(6);
      expect(gameState.actions).toBe(1);
    });

    it('should not draw a card if the deck is empty', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck1'],
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'draw',
          },
        },
      };
      gameState.playerState[playerId].deck = [];
      expect(gameState.actions).toBe(2);
      expect(gameState.playerState[playerId].hand).toHaveLength(5);
      gameState = applyTurn(gameState, turn);
      // This is sort of undefined behavior, but we want to make sure it doesn't crash
      expect(gameState.actions).toBe(1);
      expect(gameState.playerState[playerId].hand).toHaveLength(5);
    });
  });

  describe('deploy', () => {
    it('should deploy a card', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': deckDefinitions['deck1'],
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const cardInstanceId = gameState.playerState[playerId].hand[0];
      const card = gameState.cardState[cardInstanceId];
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'deploy',
            card,
            target: { x: 0, y: 0 },
          },
        },
      };
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(0);
      expect(gameState.actions).toBe(2);
      expect(gameState.playerState[playerId].hand).toHaveLength(5);
      gameState = applyTurn(gameState, turn);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(1);
      expect(getTopCard(getStack(gameState.board, { x: 0, y: 0 }))).toBe(
        cardInstanceId,
      );
      expect(gameState.playerState[playerId].hand).toHaveLength(4);
      expect(gameState.actions).toBe(1);
    });

    // TODO: Test deploy on top of another card
  });

  describe('combat', () => {
    it('should resolve combat between two cards', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }, { id: 'u-2' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': { name: 'test', list: ['dawnbringer-brute-1'] },
          'u-2': { name: 'test', list: ['dawnbringer-brute-1'] },
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const cardInstanceId = gameState.playerState[playerId].hand[0];
      gameState = deploy(gameState, cardInstanceId, { x: 0, y: 0 });
      gameState = nextActivePlayer(gameState);
      const opponentId = gameState.playerOrder[1] as `u-${number}`;
      const opponentCardInstanceId = gameState.playerState[opponentId].hand[0];
      gameState = deploy(gameState, opponentCardInstanceId, { x: 0, y: 1 });
      gameState = nextActivePlayer(gameState);
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'attack',
            cardInstanceId: cardInstanceId,
            source: { x: 0, y: 0 },
            target: { x: 0, y: 1 },
          },
        },
      };
      expect(gameState.actions).toBe(2);
      expect(gameState.playerState[playerId].hand).toHaveLength(0);
      expect(gameState.playerState[opponentId].hand).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(1);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      gameState = applyTurn(gameState, turn);
      expect(gameState.actions).toBe(1);
      expect(gameState.playerState[playerId].discard).toHaveLength(1);
      expect(gameState.playerState[opponentId].discard).toHaveLength(1);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(0);
    });

    it('should move stack if attacker wins', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }, { id: 'u-2' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': { name: 'test', list: ['dawnbringer-brute-2'] },
          'u-2': { name: 'test', list: ['dawnbringer-brute-1'] },
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const cardInstanceId = gameState.playerState[playerId].hand[0];
      gameState = deploy(gameState, cardInstanceId, { x: 0, y: 0 });
      gameState = nextActivePlayer(gameState);
      const opponentId = gameState.playerOrder[1] as `u-${number}`;
      const opponentCardInstanceId = gameState.playerState[opponentId].hand[0];
      gameState = deploy(gameState, opponentCardInstanceId, { x: 0, y: 1 });
      gameState = nextActivePlayer(gameState);
      gameState = clearAllFatigue(gameState);
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'attack',
            cardInstanceId: cardInstanceId,
            source: { x: 0, y: 0 },
            target: { x: 0, y: 1 },
          },
        },
      };
      expect(gameState.actions).toBe(2);
      expect(gameState.playerState[playerId].hand).toHaveLength(0);
      expect(gameState.playerState[opponentId].hand).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(1);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      gameState = applyTurn(gameState, turn);
      expect(gameState.actions).toBe(1);
      expect(gameState.playerState[playerId].discard).toHaveLength(0);
      expect(gameState.playerState[opponentId].discard).toHaveLength(1);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      expect(getTopCard(getStack(gameState.board, { x: 0, y: 1 }))).toBe(
        cardInstanceId,
      );
    });

    it('should not move stack if defender wins', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }, { id: 'u-2' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': { name: 'test', list: ['dawnbringer-brute-1'] },
          'u-2': { name: 'test', list: ['dawnbringer-brute-2'] },
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const cardInstanceId = gameState.playerState[playerId].hand[0];
      gameState = deploy(gameState, cardInstanceId, { x: 0, y: 0 });
      gameState = nextActivePlayer(gameState);
      const opponentId = gameState.playerOrder[1] as `u-${number}`;
      const opponentCardInstanceId = gameState.playerState[opponentId].hand[0];
      gameState = deploy(gameState, opponentCardInstanceId, { x: 0, y: 1 });
      gameState = nextActivePlayer(gameState);
      gameState = clearAllFatigue(gameState);
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'attack',
            cardInstanceId: cardInstanceId,
            source: { x: 0, y: 0 },
            target: { x: 0, y: 1 },
          },
        },
      };
      expect(gameState.actions).toBe(2);
      expect(gameState.playerState[playerId].hand).toHaveLength(0);
      expect(gameState.playerState[opponentId].hand).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(1);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      gameState = applyTurn(gameState, turn);
      expect(gameState.actions).toBe(1);
      expect(gameState.playerState[playerId].discard).toHaveLength(1);
      expect(gameState.playerState[opponentId].discard).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      expect(getTopCard(getStack(gameState.board, { x: 0, y: 1 }))).toBe(
        opponentCardInstanceId,
      );
    });

    it('should move stack if trade but attacker was stacked', () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }, { id: 'u-2' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['dawnbringer-brute-1', 'dawnbringer-brute-1'],
          },
          'u-2': { name: 'test', list: ['dawnbringer-brute-1'] },
        },
      });
      const playerId = gameState.playerOrder[0] as `u-${number}`;
      const bottomCardInstanceId = gameState.playerState[playerId].hand[0];
      gameState = deploy(gameState, bottomCardInstanceId, { x: 0, y: 0 });
      const topCardInstanceId = gameState.playerState[playerId].hand[0];
      gameState = deploy(gameState, topCardInstanceId, { x: 0, y: 0 });
      const cardInstanceId = getTopCard(
        getStack(gameState.board, { x: 0, y: 0 }),
      )!;
      gameState = nextActivePlayer(gameState);
      const opponentId = gameState.playerOrder[1] as `u-${number}`;
      const opponentCardInstanceId = gameState.playerState[opponentId].hand[0];
      gameState = deploy(gameState, opponentCardInstanceId, { x: 0, y: 1 });
      gameState = nextActivePlayer(gameState);
      gameState = clearAllFatigue(gameState);
      const turn: Turn<TurnData> = {
        playerId,
        createdAt: '',
        roundIndex: 0,
        data: {
          action: {
            type: 'attack',
            cardInstanceId: cardInstanceId,
            source: { x: 0, y: 0 },
            target: { x: 0, y: 1 },
          },
        },
      };
      expect(gameState.actions).toBe(2);
      expect(gameState.playerState[playerId].hand).toHaveLength(0);
      expect(gameState.playerState[opponentId].hand).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(2);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      gameState = applyTurn(gameState, turn);

      expect(gameState.actions).toBe(1);
      expect(gameState.playerState[playerId].discard).toHaveLength(1);
      expect(gameState.playerState[opponentId].discard).toHaveLength(1);
      expect(getStack(gameState.board, { x: 0, y: 0 })).toHaveLength(0);
      expect(getStack(gameState.board, { x: 0, y: 1 })).toHaveLength(1);
      expect(getTopCard(getStack(gameState.board, { x: 0, y: 1 }))).toBe(
        bottomCardInstanceId,
      );
      expect(gameState.cardState[bottomCardInstanceId].fatigued).toBe(false);
    });
  });
});
