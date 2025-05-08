import {
  abilityDefinitions,
  cardDefinitions,
  ValidAbilityId,
  ValidCardId,
  Card as CardType,
  CoordinateTarget,
  Coordinate,
  Target,
  CardTarget,
} from '@long-game/game-gudnak-definition/v1';
import { boardHelpers } from '@long-game/game-gudnak-definition';
import { hooks } from '../gameClient';
import { useSelect } from './useSelect';
import { useTargeting } from './useTargeting';
import { toast } from '@a-type/ui';

export function useGameAction() {
  const { submitTurn, finalState, localTurnData, turnError, playerId } =
    hooks.useGameSuite();
  const targeting = useTargeting();
  const selection = useSelect();

  const playCard = (card: CardType) => {
    const cardDef = cardDefinitions[card.cardId as ValidCardId];
    selection.set(card);
    if (cardDef.kind === 'tactic') {
      const abilityDef = abilityDefinitions[card.cardId as ValidAbilityId];
      if ('input' in abilityDef) {
        const targetInputs = abilityDef.input.targets;
        targeting.begin(targetInputs);
        targeting.onTargetsComplete((targets) => {
          submitTurn({
            action: {
              type: 'tactic',
              card,
              input: { targets },
            },
          });
        });
      } else {
        submitTurn({
          action: {
            type: 'tactic',
            card,
            input: { targets: targeting.chosen },
          },
        });
      }
    } else {
      targeting.begin([
        {
          controller: 'none',
          description: 'Choose where to deploy',
          type: 'coordinate',
        },
      ]);

      targeting.onTargetsComplete((targets) => {
        selection.clear();
        const coordinate = targets[0] as CoordinateTarget;
        submitTurn({
          action: {
            type: 'deploy',
            card,
            target: { x: coordinate.x, y: coordinate.y },
          },
        });
      });
    }
  };

  const defend = () => {
    const space = finalState.specialSpaces.find(
      (s) => s.type === 'gate' && s.ownerId === playerId,
    );
    if (!space) {
      toast.error('You do not own a gate');
      return;
    }
    const coordinate = space.coordinate;
    const stack = finalState.board[coordinate.y][coordinate.x];
    const topCard = stack[stack.length - 1];
    if (!topCard) {
      toast.error('You do not have a card in your gate');
      return;
    }
    const card = finalState.cardState[topCard];
    const cardDef = cardDefinitions[card.cardId as ValidCardId];
    if (cardDef.kind !== 'fighter') {
      toast.error('You do not have a fighter in your gate');
      return;
    }
    // TODO: Calculate true power from the game state
    const power = cardDef.power;
    selection.set(card);
    targeting.begin(
      Array.from({ length: power }, () => ({
        type: 'card',
        description: 'Choose a card to defend with',
        restrictions: [{ kind: 'unique' }, { kind: 'in-hand' }],
      })),
    );
    targeting.onTargetsComplete((targets) => {
      selection.clear();
      submitTurn({
        action: {
          type: 'defend',
          targets: targets as CardTarget[],
        },
      });
    });
  };

  const moveOrAttackCard = (source: Coordinate) => {
    const stack = finalState.board[source.y][source.x];
    const cardInstanceId = stack[stack.length - 1];
    const card = finalState.cardState[cardInstanceId];
    selection.set(card);
    targeting.begin([
      {
        controller: 'any',
        description: 'Choose where to move',
        type: 'coordinate',
      },
    ]);

    targeting.onTargetsComplete((targets) => {
      selection.clear();
      const coordinate = targets[0] as CoordinateTarget;
      const targetStack = finalState.board[coordinate.y][coordinate.x];
      if (source.x === coordinate.x && source.y === coordinate.y) {
        return;
      }
      const actionType = targetStack.length > 0 ? 'attack' : 'move';
      submitTurn({
        action: {
          type: actionType,
          cardInstanceId: cardInstanceId,
          source,
          target: { x: coordinate.x, y: coordinate.y },
        },
      });
    });
  };

  const deployOrPlayCardImmediate = (
    cardInstanceId: string,
    target: Coordinate,
  ) => {
    const card = finalState.cardState[cardInstanceId];
    const cardDef = cardDefinitions[card.cardId as ValidCardId];
    if (cardDef.kind !== 'fighter') {
      console.error(`Card ${card.cardId} is not a fighter`);
      return;
    }
    const fromHand = finalState.hand.some(
      (h) => h.instanceId === cardInstanceId,
    );
    if (fromHand) {
      submitTurn({
        action: {
          type: 'deploy',
          card,
          target,
        },
      });
    } else {
      const source = boardHelpers.findCoordFromCard(
        finalState.board,
        cardInstanceId,
      );
      if (!source) {
        console.error(`Card ${card.cardId} not found on board`);
        return;
      }
      if (source.x === target.x && source.y === target.y) {
        console.error(`Card ${card.cardId} is already at target`);
        return;
      }
      const targetStack = finalState.board[target.y][target.x];
      const actionType = targetStack.length > 0 ? 'attack' : 'move';
      submitTurn({
        action: {
          type: actionType,
          cardInstanceId: cardInstanceId,
          source,
          target,
        },
      });
    }
  };

  const activateAbility = (card: CardType, source: Coordinate) => {
    const cardDef = cardDefinitions[card.cardId as ValidCardId];
    if (cardDef.kind !== 'fighter' || cardDef.abilities.length === 0) {
      console.error(`Card ${card.cardId} is not a fighter or has no abilities`);
      return;
    }
    const abilityDef =
      abilityDefinitions[cardDef.abilities[0].id as ValidAbilityId];
    if (!abilityDef) {
      console.error(`Ability ${card.cardId} not found`);
      return;
    }
    if (abilityDef.type !== 'active') {
      console.error(`Ability ${card.cardId} is not active`);
      return;
    }
    if ('input' in abilityDef) {
      const targetInputs = abilityDef.input.targets;
      targeting.begin(targetInputs);
      targeting.onTargetsComplete((targets) => {
        selection.clear();
        submitTurn({
          action: {
            type: 'useAbility',
            abilityId: cardDef.abilities[0].id,
            cardInstanceId: card.instanceId,
            targets,
            source,
          },
        });
      });
    } else {
      submitTurn({
        action: {
          type: 'useAbility',
          abilityId: card.cardId as ValidAbilityId,
          cardInstanceId: card.instanceId,
          targets: [],
          source,
        },
      });
    }
  };

  const validTurn = !turnError;

  const targets: Target[] =
    targeting.active || !validTurn
      ? targeting.chosen
      : localTurnData?.action.type === 'useAbility'
      ? localTurnData.action.targets
      : localTurnData?.action.type === 'tactic'
      ? localTurnData.action.input.targets
      : localTurnData?.action.type === 'deploy' ||
        localTurnData?.action.type == 'move'
      ? [
          {
            kind: 'coordinate',
            x: localTurnData.action.target.x,
            y: localTurnData.action.target.y,
          },
        ]
      : [];

  return {
    playCard,
    defend,
    deployOrPlayCardImmediate,
    moveOrAttackCard,
    activateAbility,
    targeting,
    selection,
    targets,
  };
}
