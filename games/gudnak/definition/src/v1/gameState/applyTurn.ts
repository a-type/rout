import { Turn } from '@long-game/game-definition';
import {
  abilityDefinitions,
  DeployAction,
  GlobalState,
  MoveAction,
  TurnData,
  UseAbilityAction,
  ValidAbilityId,
} from '../gameDefinition';
import {
  clearFreeActions,
  deploy,
  move,
  playTactic,
  spendActions,
} from './gameStateHelpers';
import { findMatchingFreeAction, spendFreeAction } from './freeAction';
import { removeTurnBasedContinuousEffects } from './continuousEffects';
import { draw, mill } from './zone';
import { getGatesCoord, getTopCard, getStack } from './board';
import { applyFatigue } from './card';

export function applyTurn(globalState: GlobalState, turn: Turn<TurnData>) {
  const { action } = turn.data;
  const playerId = turn.playerId;
  const matchingFreeAction = findMatchingFreeAction(
    action,
    globalState.freeActions,
  );

  switch (action.type) {
    case 'draw': {
      globalState = performDraw(globalState, playerId, 1);
      break;
    }
    case 'deploy': {
      globalState = performDeploy(globalState, action);
      break;
    }
    case 'move': {
      globalState = performMove(globalState, action);
      break;
    }
    case 'tactic': {
      globalState = clearFreeActions(globalState);
      globalState = playTactic(globalState, action.card, action.input);
      break;
    }
    case 'useAbility': {
      globalState = performUseAbility(globalState, action);
      break;
    }
    case 'endTurn': {
      performEndTurn(globalState, playerId);
      break;
    }
  }

  return globalState;
}

function performDraw(
  globalState: GlobalState,
  playerId: string,
  count: number = 1,
): GlobalState {
  globalState = draw(globalState, playerId, count);
  globalState = spendActions(globalState);
  globalState = clearFreeActions(globalState);
  return globalState;
}

function performDeploy(
  globalState: GlobalState,
  action: DeployAction,
): GlobalState {
  const matchingFreeAction = findMatchingFreeAction(
    action,
    globalState.freeActions,
  );

  globalState = deploy(globalState, action.card.instanceId, action.target);
  if (matchingFreeAction) {
    globalState = spendFreeAction(globalState, matchingFreeAction);
  } else {
    globalState = spendActions(globalState);
    globalState = clearFreeActions(globalState);
  }
  return globalState;
}

function performMove(
  globalState: GlobalState,
  action: MoveAction,
): GlobalState {
  const matchingFreeAction = findMatchingFreeAction(
    action,
    globalState.freeActions,
  );

  globalState = move(
    globalState,
    action.cardInstanceId,
    action.source,
    action.target,
  );
  if (matchingFreeAction) {
    globalState = spendFreeAction(globalState, matchingFreeAction);
  } else {
    globalState = spendActions(globalState);
    globalState = clearFreeActions(globalState);
  }
  return globalState;
}

function performUseAbility(
  globalState: GlobalState,
  action: UseAbilityAction,
): GlobalState {
  const abilityId = action.abilityId as ValidAbilityId;
  const abilityDef = abilityDefinitions[abilityId];
  if ('modifyGameStateOnActivate' in abilityDef.effect) {
    globalState = abilityDef.effect.modifyGameStateOnActivate({
      globalState,
      input: { targets: action.targets },
    });
  }
  globalState = applyFatigue(globalState, action.cardInstanceId);
  globalState = spendActions(globalState);
  globalState = clearFreeActions(globalState);
  return globalState;
}

function performEndTurn(
  globalState: GlobalState,
  playerId: string,
): GlobalState {
  globalState = clearFreeActions(globalState);
  const playerIdx = globalState.playerOrder.indexOf(playerId);
  const nextPlayerIdx = (playerIdx + 1) % globalState.playerOrder.length;
  const nextPlayer = globalState.playerOrder[nextPlayerIdx];
  globalState = {
    ...globalState,
    currentPlayer: nextPlayer,
    actions: 2,
  };
  // Remove fatigue from all cards in the board
  globalState = {
    ...globalState,
    cardState: Object.fromEntries(
      Object.entries(globalState.cardState).map(([id, card]) => [
        id,
        {
          ...card,
          fatigued: false,
        },
      ]),
    ),
  };
  globalState = removeTurnBasedContinuousEffects(globalState, nextPlayer);

  const siegeLocation = getGatesCoord(globalState.playerState[nextPlayer].side);
  const siegeCardId = getTopCard(getStack(globalState.board, siegeLocation));
  const siegeCardOwner = siegeCardId
    ? globalState.cardState[siegeCardId]?.ownerId
    : null;

  if (!siegeCardOwner || siegeCardOwner === nextPlayer) {
    globalState = draw(globalState, nextPlayer);
  } else {
    globalState = mill(globalState, nextPlayer);
  }

  return globalState;
}
