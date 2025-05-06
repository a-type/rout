import { Turn } from '@long-game/game-definition';
import {
  AttackAction,
  DefendAction,
  DeployAction,
  GlobalState,
  MoveAction,
  TurnData,
  UseAbilityAction,
  ValidAbilityId,
} from '../gameDefinition';
import { abilityDefinitions } from '../definitions/abilityDefinition';
import {
  attack,
  clearAllFatigue,
  clearFreeActions,
  deploy,
  move,
  nextActivePlayer,
  playTactic,
  spendActions,
} from './gameStateHelpers';
import { findMatchingFreeAction, spendFreeAction } from './freeAction';
import { removeTurnBasedContinuousEffects } from './continuousEffects';
import { discardFromHand, draw, mill, moveFromBoardToDiscard } from './zone';
import { getGatesCoord, getTopCard, getStack } from './board';
import { applyFatigue } from './card';

export function applyTurn(globalState: GlobalState, turn: Turn<TurnData>) {
  const { action } = turn.data;
  const playerId = turn.playerId;

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
    case 'attack': {
      globalState = performAttack(globalState, action);
      break;
    }
    case 'defend': {
      globalState = performDefend(globalState, playerId, action);
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
      globalState = performEndTurn(globalState, playerId);
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
function performAttack(
  globalState: GlobalState,
  action: AttackAction,
): GlobalState {
  const matchingFreeAction = findMatchingFreeAction(
    action,
    globalState.freeActions,
  );

  globalState = attack(
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

export function performUseAbility(
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

export function performDefend(
  globalState: GlobalState,
  playerId: string,
  action: DefendAction,
): GlobalState {
  // send cards from hand to discard
  let gameState = globalState;
  action.targets.forEach((target) => {
    gameState = discardFromHand(gameState, playerId, target.instanceId);
  });
  // send targeted card from gate to discard
  const gatesCoord = getGatesCoord(globalState.playerState[playerId].side);
  const gatesStack = getStack(globalState.board, gatesCoord);
  const gatesCardId = getTopCard(gatesStack);
  if (!gatesCardId) {
    console.error('No card found in gates stack');
    return gameState;
  }
  gameState = moveFromBoardToDiscard(
    gameState,
    gameState.cardState[gatesCardId],
  );

  gameState = spendActions(gameState);

  return gameState;
}

function performEndTurn(
  globalState: GlobalState,
  playerId: string,
): GlobalState {
  globalState = clearFreeActions(globalState);
  globalState.playerState[playerId].hasTakenTurn = true;
  globalState = nextActivePlayer(globalState);
  const nextPlayer = globalState.currentPlayer;
  globalState = {
    ...globalState,
    actions: globalState.playerState[nextPlayer].hasTakenTurn ? 2 : 1,
  };
  // Remove fatigue from all cards in the board
  globalState = clearAllFatigue(globalState);
  globalState = removeTurnBasedContinuousEffects(globalState, nextPlayer);

  const siegeLocation = getGatesCoord(globalState.playerState[nextPlayer].side);
  const siegeCardId = getTopCard(getStack(globalState.board, siegeLocation));
  const siegeCardOwner = siegeCardId
    ? globalState.cardState[siegeCardId]?.ownerId
    : null;

  if (!siegeCardOwner || siegeCardOwner === nextPlayer) {
    globalState = draw(globalState, nextPlayer);
  } else {
    if (globalState.playerState[nextPlayer].deck.length > 0) {
      globalState = mill(globalState, nextPlayer);
    } else {
      globalState = {
        ...globalState,
        winner: siegeCardOwner,
      };
    }
  }

  return globalState;
}
