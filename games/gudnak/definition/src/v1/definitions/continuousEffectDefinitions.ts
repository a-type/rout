import { Card, GlobalState } from '../gameDefinition';
import { findCoordFromCard } from '../gameState/board';

// TODO: Consider renaming ability effects
export type ContinuousEffectDefinition = {
  description: string;
  validate?: {
    defend?: () => boolean;
  };
  apply?: {
    modifyCombatPower?: (props: {
      globalState: GlobalState;
      effectOwnerId: string;
      card: Card;
      attacker: boolean;
      power: number;
    }) => number;
  };
};

export const continuousEffectDefinitions = {
  'cant-be-attacked': {
    description: 'This fighter cannot be attacked.',
    validate: {
      defend: () => false,
    },
  },
  'precision-drills': {
    description: 'This stack has +1 when being Attacked.',
    apply: {
      modifyCombatPower: ({
        globalState,
        card,
        effectOwnerId,
        attacker,
        power,
      }) => {
        if (attacker) {
          return power;
        }
        const board = globalState.board;
        const coordinate = findCoordFromCard(board, card.instanceId);
        if (!coordinate) {
          console.error(`Card ${card.instanceId} not found on board`);
          return power;
        }
        const stack = board[coordinate.y][coordinate.x];
        if (stack.length > 1 && card.ownerId === effectOwnerId) {
          return power + 1;
        }
        return power;
      },
    },
  },
} satisfies Record<string, ContinuousEffectDefinition>;

export type ValidContinuousEffectKey = keyof typeof continuousEffectDefinitions;
