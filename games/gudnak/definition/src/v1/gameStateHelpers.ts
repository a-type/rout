import { GameRandom } from '@long-game/game-definition';
import { cardDefinitions, ValidCardId } from './cardDefinition';
import {
  Board,
  Card,
  CardStack,
  Coordinate,
  type GlobalState,
} from './gameDefinition';

export function getTopCard(stack: CardStack | null) {
  if (!stack || stack.length === 0) {
    return null;
  }
  return stack[stack.length - 1];
}

export function draw(
  globalState: GlobalState,
  playerId: string,
  count: number = 1,
): GlobalState {
  const playerState = globalState.playerState[playerId];
  if (playerState.deck.length === 0) {
    return globalState;
  }
  const drawnCards = playerState.deck.slice(0, count);
  const remainingDeck = playerState.deck.slice(count);
  return {
    ...globalState,
    playerState: {
      ...globalState.playerState,
      [playerId]: {
        ...playerState,
        deck: remainingDeck,
        hand: [...playerState.hand, ...drawnCards],
      },
    },
  };
}

export function shuffleDeck(
  globalState: GlobalState,
  random: GameRandom,
  playerId: string,
): GlobalState {
  const { deck, ...playerState } = globalState.playerState[playerId];
  return {
    ...globalState,
    playerState: {
      ...globalState.playerState,
      [playerId]: {
        ...playerState,
        deck: random.shuffle(deck),
      },
    },
  };
}

// Gets the stack at a position on the board
export function getStack(board: Board, coord: Coordinate): CardStack {
  const { x, y } = coord;
  // return null if out of bounds
  if (x < 0 || x >= board.length || y < 0 || y >= board[0].length) {
    throw new Error('Out of bounds');
  }
  return board[y][x];
}

export function matchingTag(a: ValidCardId, b: ValidCardId): boolean {
  const aDef = cardDefinitions[a];
  const bDef = cardDefinitions[b];
  if (aDef.kind !== 'fighter') {
    return false;
  }
  if (bDef.kind !== 'fighter') {
    return false;
  }
  return aDef.traits.some((trait) => bDef.traits.includes(trait));
}

export function canDeploy(
  board: Board,
  card: Card,
  target: Coordinate,
): boolean {
  const stack = getStack(board, target);
  if (stack.length === 0) {
    return true;
  }
  const topCard = getTopCard(stack);
  if (!topCard) {
    return true;
  }
  if (topCard.ownerId !== card.ownerId) {
    return false;
  }
  return matchingTag(topCard.cardId as ValidCardId, card.cardId as ValidCardId);
}

export function deploy(
  globalState: GlobalState,
  card: Card,
  target: Coordinate,
): GlobalState {
  if (!canDeploy(globalState.board, card, target)) {
    throw new Error('Invalid deploy');
  }
  const { x, y } = target;
  const { board } = globalState;
  const stack = getStack(board, target);
  const newStack = [...stack, card];
  const newBoard = [...board];
  newBoard[y][x] = newStack;
  const playerState = globalState.playerState[globalState.currentPlayer];
  const newPlayerState = {
    ...playerState,
    hand: playerState.hand.filter((c) => c.instanceId !== card.instanceId),
  };
  return {
    ...globalState,
    board: newBoard,
    playerState: {
      ...globalState.playerState,
      [globalState.currentPlayer]: newPlayerState,
    },
  };
}

export function spendActions(gameState: GlobalState, count: number = 1) {
  return {
    ...gameState,
    actions: gameState.actions - count,
  };
}

export function validateMove(
  board: Board,
  card: Card,
  source: Coordinate,
  target: Coordinate,
): string | undefined {
  if (!card) {
    return 'Invalid card';
  }
  const stack = getStack(board, source);
  if (stack.length === 0) {
    return 'Invalid source (no stack)';
  }
  const topCard = getTopCard(stack);
  if (!topCard) {
    return 'Invalid source (no top card)';
  }
  if (topCard.instanceId !== card.instanceId) {
    return 'Invalid source (not top card)';
  }
  const targetStack = getStack(board, target);
  if (targetStack.length === 0) {
    return;
  }
  const targetTopCard = getTopCard(targetStack);
  if (!targetTopCard) {
    return 'Invalid target (no top card)';
  }
  if (targetTopCard.ownerId === card.ownerId) {
    return 'Invalid target (same owner)';
  }
  return;
}

export function removeTopCard(board: Board, coord: Coordinate) {
  const { x, y } = coord;
  const stack = getStack(board, coord);
  if (stack.length === 0) {
    return board;
  }
  const newStack = stack.slice(0, stack.length - 1);
  const newBoard = [...board];
  newBoard[y][x] = newStack;
  return newBoard;
}

// moves a card from source to target
// moves the whole stack
// if moving into another player, resolve combat instead
export function move(
  gameState: GlobalState,
  card: Card,
  source: Coordinate,
  target: Coordinate,
): GlobalState {
  const moveErr = validateMove(gameState.board, card, source, target);
  if (moveErr) {
    throw new Error(moveErr);
  }
  let performMove = false;
  let winner: Card | null = null;
  const { x: sourceX, y: sourceY } = source;
  const { x: targetX, y: targetY } = target;
  const { board } = gameState;
  let nextBoard = [...board];
  const sourceStack = getStack(board, source);
  const targetStack = getStack(board, target);
  const targetTopCard = getTopCard(targetStack);
  if (targetStack.length === 0 || !targetTopCard) {
    performMove = true;
  } else {
    // resolve combat
    winner = resolveCombat(card, targetTopCard);
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

  console.log('move', {
    source,
    target,
    sourceStack,
    targetTopCard,
    winner,
    board: JSON.stringify(board),
    nextBoard: JSON.stringify(nextBoard),
  });

  return {
    ...gameState,
    board: nextBoard,
  };
}

export function resolveCombat(attacker: Card, defender: Card) {
  const attackerDef = cardDefinitions[attacker.cardId as ValidCardId];
  const defenderDef = cardDefinitions[defender.cardId as ValidCardId];
  console.log('resolve combat', {
    attacker,
    defender,
    attackerDef,
    defenderDef,
  });
  if (!attackerDef || !defenderDef) {
    throw new Error('Invalid card');
  }
  if (attackerDef.kind !== 'fighter' || defenderDef.kind !== 'fighter') {
    throw new Error('Not a fighter');
  }
  if (attackerDef.power > defenderDef.power) {
    console.log('attacker wins');
    return attacker;
  } else if (attackerDef.power < defenderDef.power) {
    console.log('defender wins');
    return defender;
  }
  console.log('tie');
  return null;
}
