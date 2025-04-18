import { FighterCard } from './cardDefinition';
import { ValidContinuousEffectKey } from './continuousEffectDefinitions';
import { Board, Card, FreeAction, GlobalState } from './gameDefinition';
import {
  getAdjacentCardInstanceIds,
  INVALID_MOVE_CODES,
  InvalidMoveReason,
  InvalidDeployReason,
  INVALID_DEPLOY_CODES,
  getStack,
  swapCardPositions,
  getAllBoardCoordinates,
  getTopCard,
  move,
  addContinuousEffectToCard,
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
  validateAbilityInputs?: (props: { input: EffectInput }) => string[] | null;
  modifyGameStateOnActivate?: (props: {
    globalState: GlobalState;
    input: EffectInput;
  }) => GlobalState;
};

type TacticEffect = {
  modifyGameStateOnPlay?: (props: {
    globalState: GlobalState;
    input: EffectInput;
  }) => GlobalState;
};

export type FighterAbility = {
  name: string;
  type: 'passive' | 'active' | 'deploy';
  input?: EffectInputDefinition;
  description: string;
  effect: FighterEffect;
};

export type CardTarget = {
  kind: 'card';
  instanceId: string;
};

export type CoordinateTarget = {
  kind: 'coordinate';
  x: number;
  y: number;
};

export type Target = CardTarget | CoordinateTarget;

export type EffectInput = {
  targets: Target[];
};

export type EffectTargetDefinition = {
  description: string;
  type: 'coordinate' | 'card';
  controller: 'player' | 'opponent' | 'any' | 'none';
};

// Represents an input to choose one or more targets for the effect
export type EffectInputDefinition = {
  targets: EffectTargetDefinition[];
};

export type TacticAbility = {
  type: 'tactic';
  input?: EffectInputDefinition;
  effect: TacticEffect;
};

export type AbilityDefinition = FighterAbility | TacticAbility;

export type EffectType = keyof AbilityDefinition['effect'];

// TODO: Consider renaming ability effects
export type ContinuousEffect = {
  description: string;
  // TODO: Consider adding source
  duration: 'end-of-turn' | 'owners-next-turn';
  ownerId: string;
  id: ValidContinuousEffectKey;
};

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
  reposition: {
    type: 'tactic',
    input: {
      targets: [
        {
          description: 'Choose 1st target fighter',
          type: 'coordinate',
          controller: 'player',
        },
        {
          description: 'Choose 2nd target fighter',
          type: 'coordinate',
          controller: 'player',
        },
      ],
    },
    effect: {
      modifyGameStateOnPlay({ globalState, input }) {
        const [sourceCoord, targetCoord] = input.targets;
        if (
          sourceCoord.kind !== 'coordinate' ||
          targetCoord.kind !== 'coordinate'
        ) {
          throw new Error('Invalid targets');
        }
        if (!sourceCoord || !targetCoord) {
          throw new Error('Invalid coordinates');
        }
        return {
          ...globalState,
          board: swapCardPositions(globalState.board, sourceCoord, targetCoord),
        };
      },
    },
  },
  'rapid-deployment': {
    type: 'tactic',
    effect: {
      modifyGameStateOnPlay({ globalState }) {
        return {
          ...globalState,
          freeActions: [
            ...globalState.freeActions,
            { type: 'deploy', count: 4 },
          ],
        };
      },
    },
  },
  'forced-march': {
    type: 'tactic',
    effect: {
      modifyGameStateOnPlay({ globalState }) {
        const ownedFighters = getAllBoardCoordinates(globalState.board)
          .map((coord) => {
            const topCardInstanceId = getTopCard(
              getStack(globalState.board, coord),
            );
            if (!topCardInstanceId) return false;
            return globalState.cardState[topCardInstanceId];
          })
          .filter((card) => {
            return card && card.ownerId === globalState.currentPlayer;
          }) as Card[];
        const nextFreeActions: FreeAction[] = ownedFighters.map((f) => ({
          type: 'move',
          cardInstanceId: f.instanceId,
        }));
        return {
          ...globalState,
          freeActions: [...globalState.freeActions, ...nextFreeActions],
        };
      },
    },
  },
  inspire: {
    type: 'active',
    name: 'Inspire',
    description:
      'Move or Attack with target adjacent friendly fighter, even if fatigued. Do not fatigue that fighter.',
    input: {
      targets: [
        {
          // TODO: Validate adjacency
          description: 'Choose adjacent fighter',
          type: 'coordinate',
          controller: 'player',
        },
        {
          // TODO: Validate adjacency to first target
          description: 'Choose target coordinate',
          type: 'coordinate',
          controller: 'player',
        },
      ],
    },
    effect: {
      modifyGameStateOnActivate: ({ globalState, input }) => {
        const [target1, target2] = input.targets;
        const sourceCoordinate = target1 as CoordinateTarget;
        const targetInstanceId = getTopCard(
          getStack(globalState.board, sourceCoordinate),
        );
        if (!targetInstanceId) {
          throw new Error('Invalid target');
        }
        globalState = move(
          globalState,
          targetInstanceId,
          sourceCoordinate,
          target2 as CoordinateTarget,
        );
        return globalState;
      },
    },
  },
  'brilliant-blessing': {
    name: 'Brilliant Blessing',
    type: 'active',
    description:
      'Target other friendly fighter cannot be Attacked until your next turn.',
    input: {
      targets: [
        {
          type: 'card',
          controller: 'player',
          description: 'Choose another target fighter',
        },
      ],
    },
    effect: {
      modifyGameStateOnActivate: ({ globalState, input }) => {
        const target = input.targets[0];
        if (target.kind !== 'card') {
          throw new Error('Invalid target');
        }
        const targetCard = globalState.cardState[target.instanceId];
        if (!targetCard) {
          throw new Error('Invalid target card');
        }
        const newContinuousEffect: ContinuousEffect = {
          description: "Can't be attacked until owner's next turn",
          duration: 'owners-next-turn',
          ownerId: targetCard.ownerId,
          id: 'cant-be-attacked',
        };
        return addContinuousEffectToCard(
          globalState,
          targetCard.instanceId,
          newContinuousEffect,
        );
      },
    },
  },
} satisfies Record<string, AbilityDefinition>;

export type ValidAbilityId = keyof typeof abilityDefinitions;
