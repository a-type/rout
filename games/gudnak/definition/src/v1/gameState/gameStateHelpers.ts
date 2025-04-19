import { cardDefinitions, ValidCardId } from '../definitions/cardDefinition';
import type {
  Board,
  Card,
  Coordinate,
  Side,
  GlobalState,
} from '../gameDefinition';
import {
  abilityDefinitions,
  EffectInput,
  ValidAbilityId,
} from '../definitions/abilityDefinition';
import { getStack, getTopCard, removeTopCard } from './board';
import { resolveCombat } from './combat';
import { applyFatigue } from './card';

export function deploy(
  globalState: GlobalState,
  cardInstanceId: string,
  target: Coordinate,
): GlobalState {
  const { board } = globalState;
  const card = globalState.cardState[cardInstanceId];
  const playerState = globalState.playerState[card.ownerId];
  const { x, y } = target;
  const stack = getStack(board, target);
  const newStack = [...stack, card.instanceId];
  const newBoard = [...board];
  newBoard[y][x] = newStack;
  const newPlayerState = {
    ...playerState,
    hand: playerState.hand.filter((id) => id !== card.instanceId),
  };
  globalState = {
    ...globalState,
    board: newBoard,
    playerState: {
      ...globalState.playerState,
      [globalState.currentPlayer]: newPlayerState,
    },
  };
  globalState = applyFatigue(globalState, cardInstanceId);

  return globalState;
}

export function spendActions(gameState: GlobalState, count: number = 1) {
  return {
    ...gameState,
    actions: gameState.actions - count,
  };
}

export function clearFreeActions(gameState: GlobalState) {
  return {
    ...gameState,
    freeActions: [],
  };
}

// moves a card from source to target
// moves the whole stack
// if moving into another player, resolve combat instead
export function move(
  gameState: GlobalState,
  cardInstanceId: string,
  source: Coordinate,
  target: Coordinate,
): GlobalState {
  const card = gameState.cardState[cardInstanceId];
  let performMove = false;
  let winner: Card | null = null;
  const { x: sourceX, y: sourceY } = source;
  const { x: targetX, y: targetY } = target;
  const { board } = gameState;
  let nextBoard = [...board];
  const sourceStack = getStack(board, source);
  const targetStack = getStack(board, target);
  const targetTopCardId = getTopCard(targetStack);
  const targetTopCard = targetTopCardId
    ? gameState.cardState[targetTopCardId]
    : null;
  if (targetStack.length === 0 || !targetTopCard) {
    performMove = true;
  } else {
    // resolve combat
    winner = resolveCombat(gameState, card, targetTopCard);
    if (winner && winner === card) {
      nextBoard = removeTopCard(nextBoard, target);
      if (getStack(nextBoard, target).length === 0) {
        performMove = true;
      }
    } else if (winner && winner === targetTopCard) {
      nextBoard = removeTopCard(nextBoard, source);
    } else {
      nextBoard = removeTopCard(nextBoard, source);
      nextBoard = removeTopCard(nextBoard, target);
    }
  }
  if (performMove) {
    // remove stack from source and add to target
    nextBoard[sourceY][sourceX] = [];
    nextBoard[targetY][targetX] = sourceStack;
  }

  gameState = {
    ...gameState,
    board: nextBoard,
  };
  gameState = applyFatigue(gameState, cardInstanceId);
  return gameState;
}

export function checkFatigue(card: Card) {
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    throw new Error('Invalid card');
  }
  if (cardDef.kind !== 'fighter') {
    throw new Error('Not a fighter');
  }
  const abilities = cardDef.abilities.map((a) => abilityDefinitions[a.id]);
  for (const ability of abilities) {
    if ('checkFatigued' in ability.effect) {
      return ability.effect.checkFatigued();
    }
  }
  return card.fatigued;
}

export function playTactic(
  globalState: GlobalState,
  card: Card,
  input: EffectInput,
): GlobalState {
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef || cardDef.kind !== 'tactic') {
    throw new Error('Invalid card');
  }
  // move card from hand to discard
  const playerState = globalState.playerState[card.ownerId];
  const newPlayerState = {
    ...playerState,
    hand: playerState.hand.filter((id) => id !== card.instanceId),
    discard: [...playerState.discard, card.instanceId],
  };
  let nextState = {
    ...globalState,
    playerState: {
      ...globalState.playerState,
      [card.ownerId]: newPlayerState,
    },
  };
  nextState = spendActions(nextState, cardDef.cost);

  const ability = abilityDefinitions[card.cardId as ValidAbilityId];
  if ('modifyGameStateOnPlay' in ability.effect) {
    nextState = ability.effect.modifyGameStateOnPlay({
      globalState: nextState,
      input,
    });
  }
  return nextState;
}

export function clearAllFatigue(globalState: GlobalState): GlobalState {
  return {
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
}
