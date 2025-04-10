import { FighterCard } from './cardDefinition';
import { Board, Card, GlobalState } from './gameDefinition';
import {
  getAdjacentCardInstanceIds,
  INVALID_MOVE_CODES,
  InvalidMoveReason,
  InvalidDeployReason,
  INVALID_DEPLOY_CODES,
  getStack,
} from './gameStateHelpers';

type FighterEffect = {
  modifyCombatPower?: (props: {
    attacker: FighterCard;
    defender: FighterCard;
    basePower: number;
  }) => number;
  checkFatigued?: (props: { card: FighterCard }) => boolean;
  modifyValidateMove?: (props: {
    invalidReasons: InvalidMoveReason[];
    card: Card;
    cardState: Record<string, Card>;
    source: { x: number; y: number };
    target: { x: number; y: number };
    board: Board;
  }) => InvalidMoveReason[] | null;
  modifyValidateDeploy?: (props: {
    invalidReasons: InvalidDeployReason[];
    card: Card;
    cardState: Record<string, Card>;
    target: { x: number; y: number };
    board: Board;
  }) => InvalidDeployReason[] | null;
};

type TacticEffect = {
  modifyGameStateOnPlay?: (props: { globalState: GlobalState }) => GlobalState;
};

export type FighterAbility = {
  name: string;
  type: 'passive' | 'active' | 'deploy';
  description: string;
  effect: FighterEffect;
};

export type TacticAbility = {
  type: 'tactic';
  effect: TacticEffect;
};

export type AbilityDefinition = FighterAbility | TacticAbility;

export type EffectType = keyof AbilityDefinition['effect'];

export const abilityDefinitions = {
  'superior-coordination': {
    name: 'Superior Coordination',
    type: 'passive',
    description: 'This fighter has +1 when Attacking Hunters.',
    effect: {
      modifyCombatPower: ({ defender, basePower }) => {
        if (defender.traits.includes('hunter')) {
          return basePower + 1;
        }
        return basePower;
      },
    },
  },
  'armor-piercing': {
    name: 'Armor Piercing',
    type: 'passive',
    description: 'This fighter has +1 when Attacking Brutes.',
    effect: {
      modifyCombatPower: ({ defender, basePower }) => {
        if (defender.traits.includes('brute')) {
          return basePower + 1;
        }
        return basePower;
      },
    },
  },
  'overwhelming-strength': {
    name: 'Overwhelming Strength',
    type: 'passive',
    description: 'This fighter has +1 when Attacking Soldiers.',
    effect: {
      modifyCombatPower: ({ defender, basePower }) => {
        if (defender.traits.includes('soldier')) {
          return basePower + 1;
        }
        return basePower;
      },
    },
  },
  'noble-steed': {
    name: 'Noble Steed',
    type: 'passive',
    description: 'This fighter may take actions while fatigued.',
    effect: {
      checkFatigued: () => {
        return false;
      },
    },
  },
  'fell-swoop': {
    name: 'Fell Swoop',
    type: 'passive',
    description:
      'You may Deploy or Move this fighter to any unoccupied square adjacent to a friendly fighter.',
    effect: {
      modifyValidateMove: ({
        invalidReasons,
        board,
        source,
        cardState,
        card,
      }) => {
        const hasAdjacentFriendlyCard = getAdjacentCardInstanceIds(
          board,
          source,
        ).some((id) => cardState[id].ownerId === card.ownerId);
        if (hasAdjacentFriendlyCard) {
          return invalidReasons.filter(
            (reason) => reason !== INVALID_MOVE_CODES.NOT_ADJACENT,
          );
        }
        return invalidReasons;
      },
      modifyValidateDeploy: ({
        invalidReasons,
        board,
        target,
        cardState,
        card,
      }) => {
        const hasAdjacentFriendlyCard = getAdjacentCardInstanceIds(
          board,
          target,
        ).some((id) => cardState[id].ownerId === card.ownerId);
        if (hasAdjacentFriendlyCard) {
          return invalidReasons.filter(
            (reason) => reason !== INVALID_DEPLOY_CODES.INVALID_SPACE,
          );
        }
        return invalidReasons;
      },
    },
  },
  pickup: {
    name: 'Pickup',
    type: 'deploy',
    description:
      'Deploy this fighter on top of any fighter you control in your Back Row, regardless of trait.',
    effect: {
      modifyValidateDeploy: ({ invalidReasons }) => {
        return invalidReasons.filter(
          (reason) => reason !== INVALID_DEPLOY_CODES.NO_MATCHING_TAG,
        );
      },
    },
  },
  delivery: {
    name: 'Delivery',
    type: 'active',
    description: 'Move this fighter to any unoccupied square.',
    effect: {
      modifyValidateMove: ({ invalidReasons, target, board }) => {
        const isUnoccupied = getStack(board, target).length === 0;
        if (isUnoccupied) {
          return invalidReasons.filter(
            (reason) => reason !== INVALID_MOVE_CODES.NOT_ADJACENT,
          );
        }
        return invalidReasons;
      },
    },
  },
  tempo: {
    type: 'tactic',
    effect: {
      modifyGameStateOnPlay: ({ globalState }) => {
        return {
          ...globalState,
          actions: globalState.actions + 1,
        };
      },
    },
  },
} satisfies Record<string, AbilityDefinition>;

export type ValidAbilityId = keyof typeof abilityDefinitions;
