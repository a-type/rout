import { cardDefinitions, ValidCardId } from '../definitions/cardDefinition';
import type {
  Board,
  Card,
  Coordinate,
  Side,
  PlayerState,
  DefendAction,
} from '../gameDefinition';
import {
  abilityDefinitions,
  EffectTargetDefinition,
  Target,
} from '../definitions/abilityDefinition';
import {
  continuousEffectDefinitions,
  ValidContinuousEffectKey,
} from '../definitions/continuousEffectDefinitions';
import { checkFatigue } from './gameStateHelpers';
import { matchingTag } from './card';

import {
  getStack,
  getBackRowCoords,
  getGatesCoord,
  getTopCard,
  validCoordinate,
  getAdjacentCoordinates,
} from './board';

export const INVALID_DEPLOY_CODES = {
  NO_CARD: 'Invalid deploy (no card)',
  NO_TARGET: 'Invalid deploy (no target)',
  INVALID_SPACE: 'Invalid deploy (not deployable space)',
  NOT_SAME_OWNER: 'Invalid deploy (not same owner)',
  NO_MATCHING_TAG: 'Invalid deploy (no matching tag)',
} as const;
type InvalidDeployCode = keyof typeof INVALID_DEPLOY_CODES;
export type InvalidDeployReason =
  (typeof INVALID_DEPLOY_CODES)[InvalidDeployCode];

export function validateDeploy(
  board: Board,
  cardState: Record<string, Card>,
  side: Side,
  card: Card,
  target: Coordinate,
): InvalidDeployReason[] | null {
  const reasons = [] as InvalidDeployReason[];
  const deployableSpaces = [...getBackRowCoords(side), getGatesCoord(side)];
  if (
    !deployableSpaces.some(
      (space) => space.x === target.x && space.y === target.y,
    )
  ) {
    reasons.push(INVALID_DEPLOY_CODES.INVALID_SPACE);
  }
  if (!validCoordinate(board, target)) {
    return [INVALID_DEPLOY_CODES.NO_TARGET];
  }
  const stack = getStack(board, target);
  if (!stack) {
    return [INVALID_DEPLOY_CODES.NO_TARGET];
  }
  const topCardId = getTopCard(stack);
  if (topCardId) {
    const topCard = cardState[topCardId];
    if (topCard.ownerId !== card.ownerId) {
      reasons.push(INVALID_DEPLOY_CODES.NOT_SAME_OWNER);
    }
    const hasMatchingTag = matchingTag(
      topCard.cardId as ValidCardId,
      card.cardId as ValidCardId,
    );
    if (!hasMatchingTag) {
      reasons.push(INVALID_DEPLOY_CODES.NO_MATCHING_TAG);
    }
  }
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    return [INVALID_DEPLOY_CODES.NO_CARD];
  }
  if (cardDef.kind !== 'fighter') {
    return [INVALID_DEPLOY_CODES.NO_CARD];
  }
  const abilities = cardDef.abilities.map((a) => abilityDefinitions[a.id]);
  const finalReasons = abilities.reduce((acc, ability) => {
    if ('modifyValidateDeploy' in ability.effect) {
      return ability.effect.modifyValidateDeploy({
        invalidReasons: acc,
        board,
        cardState,
        card,
        target,
      });
    }
    return acc;
  }, reasons);

  if (finalReasons.length === 0) {
    return null;
  }
  return finalReasons;
}

export const INVALID_MOVE_CODES = {
  NO_CARD: 'Invalid card (no card)',
  NOT_FIGHTER: 'Invalid card (not fighter)',
  FATIGUED: 'Invalid card (fatigued)',
  NOT_YOUR_CARD: 'Invalid card (not your card)',
  NOT_ADJACENT: 'Invalid move (not adjacent)',
  NO_STACK: 'Invalid source (no stack)',
  NO_TOP_CARD: 'Invalid source (no top card)',
  NOT_TOP_CARD: 'Invalid source (not top card)',
  NO_TARGET: 'Invalid target (no top card)',
  SPACE_OCCUPIED: 'Invalid target (space occupied)',
  SAME_COORDINATE: 'Invalid target (same coordinate)',
  CANT_BE_ATTACKED: 'Invalid target (cannot be attacked)',
} as const;

type InvalidMoveCode = keyof typeof INVALID_MOVE_CODES;
export type InvalidMoveReason = (typeof INVALID_MOVE_CODES)[InvalidMoveCode];

export function validateMove(
  board: Board,
  playerId: string,
  cardState: Record<string, Card>,
  card: Card,
  source: Coordinate,
  target: Coordinate,
): InvalidMoveReason[] | null {
  const reasons = [] as InvalidMoveReason[];
  if (source.x === target.x && source.y === target.y) {
    return [INVALID_MOVE_CODES.SAME_COORDINATE];
  }
  if (!card) {
    return [INVALID_MOVE_CODES.NO_CARD];
  }
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    return [INVALID_MOVE_CODES.NO_CARD];
  }
  if (cardDef.kind !== 'fighter') {
    return [INVALID_MOVE_CODES.NOT_FIGHTER];
  }
  const stack = getStack(board, source);
  if (stack.length === 0) {
    return [INVALID_MOVE_CODES.NO_STACK];
  }
  const topCardId = getTopCard(stack);
  if (!topCardId) {
    return [INVALID_MOVE_CODES.NO_TOP_CARD];
  }
  if (topCardId !== card.instanceId) {
    return [INVALID_MOVE_CODES.NOT_TOP_CARD];
  }
  if (card.ownerId !== playerId) {
    return [INVALID_MOVE_CODES.NOT_YOUR_CARD];
  }
  const { x: sourceX, y: sourceY } = source;
  const { x: targetX, y: targetY } = target;
  const dx = Math.abs(sourceX - targetX);
  const dy = Math.abs(sourceY - targetY);
  if (dx + dy !== 1) {
    reasons.push(INVALID_MOVE_CODES.NOT_ADJACENT);
  }

  const targetStack = getStack(board, target);
  if (targetStack.length > 0) {
    return [INVALID_MOVE_CODES.SPACE_OCCUPIED];
  }
  if (checkFatigue(card)) {
    reasons.push(INVALID_MOVE_CODES.FATIGUED);
  }

  const abilities = cardDef.abilities.map((a) => abilityDefinitions[a.id]);
  const finalReasons = abilities.reduce((acc, ability) => {
    if ('modifyValidateMove' in ability.effect) {
      return ability.effect.modifyValidateMove({
        invalidReasons: acc,
        board,
        cardState,
        card,
        source,
        target,
      });
    }
    return acc;
  }, reasons);

  if (finalReasons.length === 0) {
    return null;
  }
  return finalReasons;
}

export const INVALID_ATTACK_CODES = {
  NO_CARD: 'Invalid card (no card)',
  NOT_FIGHTER: 'Invalid card (not fighter)',
  FATIGUED: 'Invalid card (fatigued)',
  NOT_YOUR_CARD: 'Invalid card (not your card)',
  NOT_ADJACENT: 'Invalid move (not adjacent)',
  NO_STACK: 'Invalid source (no stack)',
  NO_TOP_CARD: 'Invalid source (no top card)',
  NOT_TOP_CARD: 'Invalid source (not top card)',
  NO_TARGET: 'Invalid target (no top card)',
  SAME_OWNER: 'Invalid target (same owner)',
  SAME_COORDINATE: 'Invalid target (same coordinate)',
  CANT_BE_ATTACKED: 'Invalid target (cannot be attacked)',
} as const;
type InvalidAttackCode = keyof typeof INVALID_ATTACK_CODES;
export type InvalidAttackReason =
  (typeof INVALID_ATTACK_CODES)[InvalidAttackCode];

export function validateAttack(
  board: Board,
  playerId: string,
  cardState: Record<string, Card>,
  card: Card,
  source: Coordinate,
  target: Coordinate,
): InvalidAttackReason[] | null {
  const reasons = [] as InvalidAttackReason[];
  if (source.x === target.x && source.y === target.y) {
    return [INVALID_ATTACK_CODES.SAME_COORDINATE];
  }
  if (!card) {
    return [INVALID_ATTACK_CODES.NO_CARD];
  }
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    return [INVALID_ATTACK_CODES.NO_CARD];
  }
  if (cardDef.kind !== 'fighter') {
    return [INVALID_ATTACK_CODES.NOT_FIGHTER];
  }
  const stack = getStack(board, source);
  if (stack.length === 0) {
    return [INVALID_ATTACK_CODES.NO_STACK];
  }
  const topCardId = getTopCard(stack);
  if (!topCardId) {
    return [INVALID_ATTACK_CODES.NO_TOP_CARD];
  }
  if (topCardId !== card.instanceId) {
    return [INVALID_ATTACK_CODES.NOT_TOP_CARD];
  }
  if (card.ownerId !== playerId) {
    return [INVALID_ATTACK_CODES.NOT_YOUR_CARD];
  }
  const { x: sourceX, y: sourceY } = source;
  const { x: targetX, y: targetY } = target;
  const dx = Math.abs(sourceX - targetX);
  const dy = Math.abs(sourceY - targetY);
  if (dx + dy !== 1) {
    reasons.push(INVALID_ATTACK_CODES.NOT_ADJACENT);
  }

  const targetStack = getStack(board, target);
  if (targetStack.length === 0) {
    return [INVALID_ATTACK_CODES.NO_TARGET];
  }
  const targetTopCardId = getTopCard(targetStack);
  if (!targetTopCardId) {
    return [INVALID_ATTACK_CODES.NO_TARGET];
  }
  const targetTopCard = cardState[targetTopCardId];
  if (!targetTopCard) {
    return [INVALID_ATTACK_CODES.NO_TARGET];
  }

  if (targetTopCard.ownerId === card.ownerId) {
    reasons.push(INVALID_ATTACK_CODES.SAME_OWNER);
  }

  if (
    targetTopCard.continuousEffects.some((effect) => {
      const effectDef =
        continuousEffectDefinitions[effect.id as ValidContinuousEffectKey];
      if ('validate' in effectDef && 'defend' in effectDef.validate) {
        return !effectDef.validate.defend();
      }
      return true;
    })
  ) {
    reasons.push(INVALID_ATTACK_CODES.CANT_BE_ATTACKED);
  }
  if (checkFatigue(card)) {
    reasons.push(INVALID_ATTACK_CODES.FATIGUED);
  }

  const abilities = cardDef.abilities.map((a) => abilityDefinitions[a.id]);
  const finalReasons = abilities.reduce((acc, ability) => {
    if ('modifyValidateAttack' in ability.effect) {
      return ability.effect.modifyValidateAttack({
        invalidReasons: acc,
        board,
        cardState,
        card,
        source,
        target,
      });
    }
    return acc;
  }, reasons);

  if (finalReasons.length === 0) {
    return null;
  }
  return finalReasons;
}

export const INVALID_TARGET_CODES = {
  NUMBER_OF_TARGETS: 'Invalid target (invalid number of targets)',
  COORDINATE: 'Invalid target (invalid coordinate)',
  OWNER: 'Invalid target (invalid owner)',
  MISSING_CARD: 'Invalid target (missing card)',
  CARD_PRESENT: 'Invalid target (card present)',
  RESTRICTION_ADJACENT: 'Invalid target (not adjacent)',
} as const;
type InvalidTargetCode = keyof typeof INVALID_TARGET_CODES;
export type InvalidTargetReason =
  (typeof INVALID_TARGET_CODES)[InvalidTargetCode];

export function validateTargets(
  playerState: PlayerState,
  playerId: string,
  source: Coordinate | null,
  targetDefinition: EffectTargetDefinition[],
  targets: Target[],
): InvalidTargetReason[] | null {
  const { cardState, board } = playerState;
  if (targets.length !== targetDefinition.length) {
    return [INVALID_TARGET_CODES.NUMBER_OF_TARGETS];
  }
  const invalidTargets = targets.flatMap((target, idx) => {
    const targetDef = targetDefinition[idx];
    const reasons = [] as InvalidTargetReason[];
    if (target.kind === 'coordinate') {
      const coord = target as Coordinate;
      if (!validCoordinate(board, coord)) {
        reasons.push(INVALID_TARGET_CODES.COORDINATE);
      }
      switch (targetDef.controller) {
        case 'any': {
          break;
        }
        case 'none': {
          const stack = getStack(board, coord);
          const topCardId = getTopCard(stack);
          if (topCardId) {
            reasons.push(INVALID_TARGET_CODES.CARD_PRESENT);
          }
          break;
        }
        case 'player': {
          const stack = getStack(board, coord);
          const topCardId = getTopCard(stack);
          if (topCardId) {
            const topCard = cardState[topCardId];
            if (topCard.ownerId !== playerId) {
              reasons.push(INVALID_TARGET_CODES.OWNER);
            }
          } else {
            reasons.push(INVALID_TARGET_CODES.MISSING_CARD);
          }
          break;
        }
        case 'opponent': {
          const stack = getStack(board, coord);
          const topCardId = getTopCard(stack);
          if (topCardId) {
            const topCard = cardState[topCardId];
            if (topCard.ownerId === playerId) {
              reasons.push(INVALID_TARGET_CODES.OWNER);
            }
          } else {
            reasons.push(INVALID_TARGET_CODES.MISSING_CARD);
          }
          break;
        }
        case 'not-friendly': {
          const stack = getStack(board, coord);
          const topCardId = getTopCard(stack);
          if (topCardId) {
            const topCard = cardState[topCardId];
            if (topCard.ownerId === playerId) {
              reasons.push(INVALID_TARGET_CODES.OWNER);
            }
          }
          break;
        }
      }

      if (targetDef.restrictions) {
        for (const restriction of targetDef.restrictions) {
          if (restriction.kind === 'adjacent') {
            let otherCoordinate: Coordinate | null = null;
            if (restriction.to === 'source' && source) {
              otherCoordinate = source;
            } else if (
              restriction.to === 'previous-target' &&
              targets[idx - 1]?.kind === 'coordinate'
            ) {
              otherCoordinate = targets[idx - 1] as Coordinate;
            }
            if (
              !otherCoordinate ||
              !getAdjacentCoordinates(board, coord).some(
                (c) => c.x === otherCoordinate.x && c.y === otherCoordinate.y,
              )
            ) {
              reasons.push(INVALID_TARGET_CODES.RESTRICTION_ADJACENT);
            }
          }
        }
      }
    }
    return reasons;
  });
  if (invalidTargets.length === 0) {
    return null;
  }
  return invalidTargets;
}

const INVALID_DEFEND_CODES = {
  NO_CARD: 'Invalid defend (no card)',
  NO_CARD_AT_GATE: 'Invalid defend (no card at gate)',
  INCORRECT_NUMBER_OF_TARGETS: 'Invalid defend (incorrect number of targets)',
  NOT_ENEMY_CARD: 'Invalid defend (not enemy card)',
  NOT_IN_HAND: 'Invalid defend (targets not in hand)',
  NOT_UNIQUE: 'Invalid defend (targets not unique)',
};

export type InvalidDefendCode = keyof typeof INVALID_DEFEND_CODES;
export type InvalidDefendReason =
  (typeof INVALID_DEFEND_CODES)[InvalidDefendCode];

export function validateDefend(
  playerState: PlayerState,
  playerId: string,
  action: DefendAction,
): InvalidDefendReason[] | null {
  const { cardState, board } = playerState;
  const reasons = [] as InvalidDefendReason[];
  const { targets } = action;
  const space = getGatesCoord(playerState.side);
  const stack = getStack(board, space);
  if (stack.length === 0) {
    return [INVALID_DEFEND_CODES.NO_CARD_AT_GATE];
  }
  const topCardId = getTopCard(stack);
  if (!topCardId) {
    return [INVALID_DEFEND_CODES.NO_CARD_AT_GATE];
  }
  const topCard = cardState[topCardId];
  if (topCard.ownerId === playerId) {
    reasons.push(INVALID_DEFEND_CODES.NOT_ENEMY_CARD);
  }
  const topCardDef = cardDefinitions[topCard.cardId as ValidCardId];
  if (!topCardDef || topCardDef.kind !== 'fighter') {
    return [INVALID_DEFEND_CODES.NO_CARD];
  }
  const power = topCardDef.power;
  if (targets.length != power) {
    reasons.push(INVALID_DEFEND_CODES.INCORRECT_NUMBER_OF_TARGETS);
  }
  // Ensure targets are from hand
  if (
    targets.some((t) =>
      playerState.hand.every((c) => c.instanceId !== t.instanceId),
    )
  ) {
    reasons.push(INVALID_DEFEND_CODES.NOT_IN_HAND);
  }
  // Ensure targets are unique
  if (
    targets.some(
      (t) => targets.filter((c) => c.instanceId === t.instanceId).length > 1,
    )
  ) {
    reasons.push(INVALID_DEFEND_CODES.NOT_UNIQUE);
  }

  if (reasons.length === 0) {
    return null;
  }
  return reasons;
}
