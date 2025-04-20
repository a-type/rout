import {
  abilityDefinitions,
  cardDefinitions,
  ValidAbilityId,
  ValidCardId,
  Card as CardType,
  CoordinateTarget,
  Coordinate,
  Target,
} from '@long-game/game-gudnak-definition/v1';
import { hooks } from './gameClient';
import { useSelect } from './useSelect';
import { useTargeting } from './useTargeting';

export function useGameAction() {
  const { submitTurn, finalState, localTurnData } = hooks.useGameSuite();
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

  const moveCard = (source: Coordinate) => {
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
      const coordinate = targets[0] as CoordinateTarget;
      submitTurn({
        action: {
          type: 'move',
          cardInstanceId: cardInstanceId,
          source,
          target: { x: coordinate.x, y: coordinate.y },
        },
      });
    });
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

  const targets: Target[] = targeting.active
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
    moveCard,
    activateAbility,
    targeting,
    selection,
    targets,
  };
}
