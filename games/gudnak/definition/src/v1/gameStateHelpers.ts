import { GameRandom } from '@long-game/game-definition';
import { cardDefinitions, ValidCardId } from './cardDefinition';
import type {
  Board,
  Card,
  CardStack,
  Coordinate,
  Side,
  GlobalState,
  Space,
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

export function validateDeploy(
  board: Board,
  cardState: Record<string, Card>,
  side: Side,
  card: Card,
  target: Coordinate,
): string | undefined {
  const deployableSpaces = [...getBackRowCoords(side), getGatesCoord(side)];
  if (
    !deployableSpaces.some(
      (space) => space.x === target.x && space.y === target.y,
    )
  ) {
    return 'Invalid deploy (not deployable space)';
  }
  const stack = getStack(board, target);
  if (stack.length === 0) {
    return;
  }
  const topCardId = getTopCard(stack);
  if (!topCardId) {
    return;
  }
  const topCard = cardState[topCardId];
  if (topCard.ownerId !== card.ownerId) {
    return 'Invalid deploy (not same owner)';
  }
  const hasMatchingTag = matchingTag(
    topCard.cardId as ValidCardId,
    card.cardId as ValidCardId,
  );
  if (!hasMatchingTag) {
    return 'Invalid deploy (no matching tag)';
  }
  return;
}

export function deploy(
  globalState: GlobalState,
  cardInstanceId: string,
  target: Coordinate,
): GlobalState {
  const { board } = globalState;
  const card = globalState.cardState[cardInstanceId];
  const playerState = globalState.playerState[card.ownerId];
  // const deployErr = validateDeploy(
  //   board,
  //   globalState.cardState,
  //   playerState.side,
  //   card,
  //   target,
  // );
  // if (deployErr) {
  //   throw new Error(deployErr);
  // }
  const { x, y } = target;
  const stack = getStack(board, target);
  const newStack = [...stack, card.instanceId];
  const newBoard = [...board];
  newBoard[y][x] = newStack;
  const newPlayerState = {
    ...playerState,
    hand: playerState.hand.filter((id) => id !== card.instanceId),
  };
  return {
    ...globalState,
    cardState: {
      ...globalState.cardState,
      [cardInstanceId]: { ...card, fatigued: true },
    },
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
  cardState: Record<string, Card>,
  card: Card,
  source: Coordinate,
  target: Coordinate,
): string | undefined {
  if (!card) {
    return 'Invalid card';
  }

  if (card.fatigued) {
    return 'Invalid card (fatigued)';
  }

  const { x: sourceX, y: sourceY } = source;
  const { x: targetX, y: targetY } = target;
  const dx = Math.abs(sourceX - targetX);
  const dy = Math.abs(sourceY - targetY);
  if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
    return 'Invalid move (not adjacent)';
  }
  const stack = getStack(board, source);
  if (stack.length === 0) {
    return 'Invalid source (no stack)';
  }
  const topCardId = getTopCard(stack);
  if (!topCardId) {
    return 'Invalid source (no top card)';
  }
  if (topCardId !== card.instanceId) {
    return 'Invalid source (not top card)';
  }
  const targetStack = getStack(board, target);
  if (targetStack.length === 0) {
    return;
  }
  const targetTopCardId = getTopCard(targetStack);
  if (!targetTopCardId) {
    return 'Invalid target (no top card)';
  }
  const targetTopCard = cardState[targetTopCardId];
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

export function addToDiscard(gameState: GlobalState, card: Card) {
  return {
    ...gameState,
    playerState: {
      ...gameState.playerState,
      [card.ownerId]: {
        ...gameState.playerState[card.ownerId],
        discard: [...gameState.playerState[card.ownerId].discard, card],
      },
    },
  };
}

export function mill(
  gameState: GlobalState,
  playerId: string,
  count: number = 1,
) {
  const playerState = gameState.playerState[playerId];
  if (playerState.deck.length === 0) {
    return gameState;
  }
  const milledCards = playerState.deck.slice(0, count);
  const remainingDeck = playerState.deck.slice(count);
  return {
    ...gameState,
    playerState: {
      ...gameState.playerState,
      [playerId]: {
        ...playerState,
        deck: remainingDeck,
        discard: [...playerState.discard, ...milledCards],
      },
    },
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
  console.log('move', {
    source,
    target,
    card,
  });

  // const moveErr = validateMove(
  //   gameState.board,
  //   gameState.cardState,
  //   card,
  //   source,
  //   target,
  // );
  // if (moveErr) {
  //   throw new Error(moveErr);
  // }
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
    cardState: {
      ...gameState.cardState,
      [cardInstanceId]: { ...card, fatigued: true },
    },
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

export function getBackRowCoords(side: Side): Coordinate[] {
  const backRow = side === 'top' ? 0 : 2;
  return [
    { x: 0, y: backRow },
    { x: 2, y: backRow },
  ];
}

export function getGatesCoord(side: Side) {
  return side === 'top' ? { x: 1, y: 0 } : { x: 1, y: 2 };
}

export function getSpecialSpaces(
  gameState: GlobalState,
  playerIds: string[],
): Space[] {
  const specialSpaces: Space[] = [];
  playerIds.forEach((playerId) => {
    const playerState = gameState.playerState[playerId];
    const backRowCoords = getBackRowCoords(playerState.side);
    backRowCoords.forEach((coord) => {
      specialSpaces.push({
        coordinate: coord,
        type: 'backRow',
        ownerId: playerId,
      });
    });
    const gatesCoord = getGatesCoord(playerState.side);
    specialSpaces.push({
      coordinate: gatesCoord,
      type: 'gate',
      ownerId: playerId,
    });
  });
  return specialSpaces;
}

export function getCardIdsFromBoard(board: Board): string[] {
  return board.flatMap((row) => row.flatMap((stack) => stack));
}
