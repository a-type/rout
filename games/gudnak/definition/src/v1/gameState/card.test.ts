import { GameRandom } from '@long-game/game-definition';
import { expect, it, describe } from 'vitest';
import { generateInitialGameState } from './generate';
import { clearAllFatigue, deploy, move, playTactic } from './gameStateHelpers';
import {
  findCoordFromCard,
  getCardIdsFromBoard,
  getStack,
  getTopCard,
} from './board';
import { Coordinate, GlobalState, ValidCardId } from '../gameDefinition';
import { abilityDefinitions, Target } from '../definitions/abilityDefinition';
import {
  INVALID_TARGET_CODES,
  validateDeploy,
  validateTargets,
} from './validation';
import { getPlayerState } from './getPlayerState';
import { performUseAbility } from './applyTurn';

const hunter1: ValidCardId = 'dusklight-hunter-1';
const brute1: ValidCardId = 'dawnbringer-brute-1';
const soldier1: ValidCardId = 'solaran-soldier-1';
const hunter2: ValidCardId = 'dusklight-hunter-2';
const brute2: ValidCardId = 'dawnbringer-brute-2';
const soldier2: ValidCardId = 'solaran-soldier-2';

function findCardInstanceIdFromHand(
  gameState: ReturnType<typeof generateInitialGameState>,
  playerId: string,
  cardId: ValidCardId,
) {
  const hand = gameState.playerState[playerId].hand;
  return hand.find((id) => gameState.cardState[id].cardId === cardId);
}

function findCardInstanceFromBoard(
  gameState: ReturnType<typeof generateInitialGameState>,
  playerId: string,
  cardId: ValidCardId,
) {
  const cards = getCardIdsFromBoard(gameState.board).map(
    (id) => gameState.cardState[id],
  );
  const card = cards.find(
    (card) => card.cardId === cardId && card.ownerId === playerId,
  );
  if (!card) {
    throw new Error(`Card ${cardId} not found in board`);
  }
  return card;
}

function deployCardFromHand(
  gameState: GlobalState,
  playerId: string,
  cardId: ValidCardId,
  coordinate: { x: number; y: number },
): GlobalState {
  const instanceId = findCardInstanceIdFromHand(gameState, playerId, cardId);
  if (!instanceId) {
    throw new Error(`Card ${cardId} not found in hand`);
  }

  gameState = deploy(gameState, instanceId, coordinate);
  return gameState;
}

describe('card testing', {}, () => {
  describe('rock paper scissors combat', {}, () => {
    it.for([
      [hunter1, brute1],
      [brute1, soldier1],
      [soldier1, hunter1],
      [brute2, hunter1],
      [soldier2, brute1],
      [hunter2, soldier1],
    ])('should handle attacker wins correctly (%s > %s)', ([id1, id2]) => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }, { id: 'u-2' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: [id1 as ValidCardId],
          },
          'u-2': {
            name: 'test',
            list: [id2 as ValidCardId],
          },
        },
      });

      const instanceId = gameState.playerState['u-1'].hand[0];
      gameState = deploy(gameState, instanceId, { x: 0, y: 0 });
      const instanceId2 = gameState.playerState['u-2'].hand[0];
      gameState = deploy(gameState, instanceId2, { x: 0, y: 1 });
      gameState = move(gameState, instanceId, { x: 0, y: 0 }, { x: 0, y: 1 });
      expect(findCoordFromCard(gameState.board, instanceId)).toEqual({
        x: 0,
        y: 1,
      });
    });
  });

  describe('solaran cavalry', {}, () => {
    it('should be able to act when fatigued', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['solaran-cavalry'],
          },
        },
      });
      const instanceId = gameState.playerState['u-1'].hand[0];
      const validate = validateDeploy(
        gameState.board,
        gameState.cardState,
        'top',
        gameState.cardState[instanceId],
        { x: 0, y: 0 },
      );
      expect(validate).toBeNull();
      gameState = deploy(gameState, instanceId, { x: 0, y: 0 });
      const card = gameState.cardState[instanceId];
      expect(card.fatigued).toBe(true);
      gameState = move(gameState, instanceId, { x: 0, y: 0 }, { x: 0, y: 1 });
      expect(findCoordFromCard(gameState.board, instanceId)).toEqual({
        x: 0,
        y: 1,
      });
    });
  });

  describe('bullgryff', {}, () => {
    it('should be able to deploy on top of a card with any tag', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['dawnbringer-brute-1', 'bullgryff'],
          },
        },
      });
      const instanceId = findCardInstanceIdFromHand(
        gameState,
        'u-1',
        'bullgryff',
      );
      const instanceId2 = findCardInstanceIdFromHand(
        gameState,
        'u-1',
        'dawnbringer-brute-1',
      );
      if (!instanceId || !instanceId2) {
        throw new Error('Card not found in hand');
      }
      deploy(gameState, instanceId2, { x: 0, y: 0 });
      const validate = validateDeploy(
        gameState.board,
        gameState.cardState,
        'top',
        gameState.cardState[instanceId],
        { x: 0, y: 0 },
      );
      expect(validate).toBeNull();
      gameState = deploy(gameState, instanceId, { x: 0, y: 0 });
      expect(findCoordFromCard(gameState.board, instanceId)).toEqual({
        x: 0,
        y: 0,
      });
    });

    it('should be able to move any distance', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['bullgryff'],
          },
        },
      });
      const instanceId = gameState.playerState['u-1'].hand[0];
      gameState = deploy(gameState, instanceId, { x: 0, y: 0 });
      const card = gameState.cardState[instanceId];
      expect(card.fatigued).toBe(true);
      gameState = move(gameState, instanceId, { x: 0, y: 0 }, { x: 2, y: 2 });
      expect(findCoordFromCard(gameState.board, instanceId)).toEqual({
        x: 2,
        y: 2,
      });
    });
  });

  describe('reposition', {}, () => {
    it('should be able to reposition', {}, () => {
      let gameState = generateInitialGameState({
        members: [{ id: 'u-1' }],
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['reposition', 'dawnbringer-brute-1', 'dusklight-hunter-1'],
          },
        },
      });
      const repositionId = findCardInstanceIdFromHand(
        gameState,
        'u-1',
        'reposition',
      );
      const bruteId = findCardInstanceIdFromHand(
        gameState,
        'u-1',
        'dawnbringer-brute-1',
      );
      const hunterId = findCardInstanceIdFromHand(
        gameState,
        'u-1',
        'dusklight-hunter-1',
      );
      if (!repositionId || !bruteId || !hunterId) {
        throw new Error('Card not found in hand');
      }
      gameState = deploy(gameState, hunterId, { x: 0, y: 0 });
      gameState = deploy(gameState, bruteId, { x: 0, y: 1 });
      gameState = playTactic(gameState, gameState.cardState[repositionId], {
        targets: [
          { kind: 'coordinate', x: 0, y: 0 },
          { kind: 'coordinate', x: 0, y: 1 },
        ],
      });

      expect(findCoordFromCard(gameState.board, bruteId)).toEqual({
        x: 0,
        y: 0,
      });
      expect(findCoordFromCard(gameState.board, hunterId)).toEqual({
        x: 0,
        y: 1,
      });
    });

    it(
      'should not be able to reposition if one target is missing a card',
      {},
      () => {
        const members = [{ id: 'u-1' }];
        let gameState = generateInitialGameState({
          members,
          random: new GameRandom('test'),
          decklists: {
            'u-1': {
              name: 'test',
              list: ['reposition', 'dawnbringer-brute-1'],
            },
          },
        });
        const repositionId = findCardInstanceIdFromHand(
          gameState,
          'u-1',
          'reposition',
        );
        if (!repositionId) {
          throw new Error('Card not found in hand');
        }
        gameState = deployCardFromHand(
          gameState,
          'u-1',
          'dawnbringer-brute-1',
          { x: 0, y: 0 },
        );
        const playerHiddenState = getPlayerState({
          globalState: gameState,
          playerId: 'u-1',
          members,
        });
        const validation = validateTargets(
          playerHiddenState,
          'u-1',
          null,
          abilityDefinitions['reposition'].input.targets,
          [
            { kind: 'coordinate', x: 0, y: 0 },
            { kind: 'coordinate', x: 0, y: 1 },
          ],
        );
        expect(validation).not.toBeNull();
        expect(validation).toContain(INVALID_TARGET_CODES.MISSING_CARD);
      },
    );
  });

  describe('standardbearer', {}, () => {
    it('should be able to command an ally to attack', {}, () => {
      const members = [{ id: 'u-1' }, { id: 'u-2' }];
      let gameState = generateInitialGameState({
        members,
        random: new GameRandom('test'),
        decklists: {
          'u-1': {
            name: 'test',
            list: ['standardbearer', 'dawnbringer-brute-2'],
          },
          'u-2': {
            name: 'test',
            list: ['dawnbringer-brute-1'],
          },
        },
      });
      gameState = deployCardFromHand(gameState, 'u-1', 'standardbearer', {
        x: 0,
        y: 0,
      });
      gameState = deployCardFromHand(gameState, 'u-1', 'dawnbringer-brute-2', {
        x: 0,
        y: 1,
      });
      gameState = deployCardFromHand(gameState, 'u-2', 'dawnbringer-brute-1', {
        x: 0,
        y: 2,
      });
      gameState = clearAllFatigue(gameState);
      const source: Coordinate = { x: 0, y: 0 };
      const targets: Target[] = [
        { kind: 'coordinate', x: 0, y: 1 },
        { kind: 'coordinate', x: 0, y: 2 },
      ];
      const validation = validateTargets(
        getPlayerState({
          globalState: gameState,
          playerId: 'u-1',
          members,
        }),
        'u-1',
        source,
        abilityDefinitions['inspire'].input.targets,
        targets,
      );
      expect(validation).toBeNull();
      gameState = performUseAbility(gameState, {
        type: 'useAbility',
        abilityId: 'inspire',
        cardInstanceId: findCardInstanceFromBoard(
          gameState,
          'u-1',
          'standardbearer',
        ).instanceId,
        targets,
        source: { x: 0, y: 0 },
      });
      // expect attack to have been performed
      const topCard = getTopCard(getStack(gameState.board, { x: 0, y: 2 }));
      if (!topCard) {
        throw new Error('Top card not found');
      }
      expect(gameState.cardState[topCard]).toHaveProperty(
        'cardId',
        'dawnbringer-brute-2',
      );
    });
  });
});
