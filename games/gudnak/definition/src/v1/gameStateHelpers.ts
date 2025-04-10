import { GameRandom } from '@long-game/game-definition';
import {
  cardDefinitions,
  FighterCard,
  Trait,
  ValidCardId,
} from './cardDefinition';
import type {
  Board,
  Card,
  CardStack,
  Coordinate,
  Side,
  GlobalState,
  Space,
} from './gameDefinition';
import { abilityDefinitions } from './abilityDefinition';

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

export function hasTrait(card: Card, trait: Trait): boolean {
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    throw new Error('Invalid card');
  }
  if (cardDef.kind !== 'fighter') {
    throw new Error('Not a fighter');
  }
  return (cardDef.traits as Trait[]).includes(trait);
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
  return aDef.traits.some((trait) => (bDef.traits as Trait[]).includes(trait));
}

export const INVALID_DEPLOY_CODES = {
  NO_CARD: 'Invalid deploy (no card)',
  INVALID_SPACE: 'Invalid deploy (not deployable space)',
  NOT_SAME_OWNER: 'Invalid deploy (not same owner)',
  NO_MATCHING_TAG: 'Invalid deploy (no matching tag)',
} as const;
type InvalidDeployCode = keyof typeof INVALID_DEPLOY_CODES;
export type InvalidDeployReason =
  (typeof INVALID_DEPLOY_CODES)[InvalidDeployCode];

export function validateDeploy(
  board: Board,
  cardState: Record<string, Card>,
  side: Side,
  card: Card,
  target: Coordinate,
): InvalidDeployReason[] | null {
  const reasons = [] as InvalidDeployReason[];
  const deployableSpaces = [...getBackRowCoords(side), getGatesCoord(side)];
  if (
    !deployableSpaces.some(
      (space) => space.x === target.x && space.y === target.y,
    )
  ) {
    reasons.push(INVALID_DEPLOY_CODES.INVALID_SPACE);
  }
  const topCardId = getTopCard(getStack(board, target));
  if (topCardId) {
    const topCard = cardState[topCardId];
    if (topCard.ownerId !== card.ownerId) {
      reasons.push(INVALID_DEPLOY_CODES.NOT_SAME_OWNER);
    }
    const hasMatchingTag = matchingTag(
      topCard.cardId as ValidCardId,
      card.cardId as ValidCardId,
    );
    if (!hasMatchingTag) {
      reasons.push(INVALID_DEPLOY_CODES.NO_MATCHING_TAG);
    }
  }
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    return [INVALID_DEPLOY_CODES.NO_CARD];
  }
  if (cardDef.kind !== 'fighter') {
    return [INVALID_DEPLOY_CODES.NO_CARD];
  }
  const abilities = cardDef.abilities.map((a) => abilityDefinitions[a.id]);
  const finalReasons = abilities.reduce((acc, ability) => {
    if ('modifyValidateDeploy' in ability.effect) {
      return ability.effect.modifyValidateDeploy({
        invalidReasons: acc,
        board,
        cardState,
        card,
        target,
      });
    }
    return acc;
  }, reasons);

  if (finalReasons.length === 0) {
    return null;
  }
  return finalReasons;
}

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

export const INVALID_MOVE_CODES = {
  NO_CARD: 'Invalid card (no card)',
  NOT_FIGHTER: 'Invalid card (not fighter)',
  FATIGUED: 'Invalid card (fatigued)',
  NOT_YOUR_CARD: 'Invalid card (not your card)',
  NOT_ADJACENT: 'Invalid move (not adjacent)',
  NO_STACK: 'Invalid source (no stack)',
  NO_TOP_CARD: 'Invalid source (no top card)',
  NOT_TOP_CARD: 'Invalid source (not top card)',
  NO_TARGET: 'Invalid target (no top card)',
  SAME_OWNER: 'Invalid target (same owner)',
} as const;

type InvalidMoveCode = keyof typeof INVALID_MOVE_CODES;
export type InvalidMoveReason = (typeof INVALID_MOVE_CODES)[InvalidMoveCode];

export function validateMove(
  board: Board,
  playerId: string,
  cardState: Record<string, Card>,
  card: Card,
  source: Coordinate,
  target: Coordinate,
): InvalidMoveReason[] | null {
  if (!card) {
    return [INVALID_MOVE_CODES.NO_CARD];
  }
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    return [INVALID_MOVE_CODES.NO_CARD];
  }
  if (cardDef.kind !== 'fighter') {
    return [INVALID_MOVE_CODES.NOT_FIGHTER];
  }
  const stack = getStack(board, source);
  if (stack.length === 0) {
    return [INVALID_MOVE_CODES.NO_STACK];
  }
  const topCardId = getTopCard(stack);
  if (!topCardId) {
    return [INVALID_MOVE_CODES.NO_TOP_CARD];
  }
  if (topCardId !== card.instanceId) {
    return [INVALID_MOVE_CODES.NOT_TOP_CARD];
  }
  const targetStack = getStack(board, target);
  if (targetStack.length === 0) {
    return null;
  }
  const targetTopCardId = getTopCard(targetStack);
  if (!targetTopCardId) {
    return [INVALID_MOVE_CODES.NO_TARGET];
  }
  const targetTopCard = cardState[targetTopCardId];
  if (!targetTopCard) {
    return [INVALID_MOVE_CODES.NO_TARGET];
  }
  const reasons = [] as InvalidMoveReason[];

  const { x: sourceX, y: sourceY } = source;
  const { x: targetX, y: targetY } = target;
  const dx = Math.abs(sourceX - targetX);
  const dy = Math.abs(sourceY - targetY);
  if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
    reasons.push(INVALID_MOVE_CODES.NOT_ADJACENT);
  }
  if (targetTopCard.ownerId === card.ownerId) {
    reasons.push(INVALID_MOVE_CODES.SAME_OWNER);
  }
  if (card.fatigued) {
    reasons.push(INVALID_MOVE_CODES.FATIGUED);
  }
  if (card.ownerId !== playerId) {
    reasons.push(INVALID_MOVE_CODES.NOT_YOUR_CARD);
  }

  const abilities = cardDef.abilities.map((a) => abilityDefinitions[a.id]);
  const finalReasons = abilities.reduce((acc, ability) => {
    if ('modifyValidateMove' in ability.effect) {
      return ability.effect.modifyValidateMove({
        invalidReasons: acc,
        board,
        cardState,
        card,
        source,
        target,
      });
    }
    return acc;
  }, reasons);

  if (finalReasons.length === 0) {
    return null;
  }
  return finalReasons;
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

  return {
    ...gameState,
    cardState: {
      ...gameState.cardState,
      [cardInstanceId]: { ...card, fatigued: true },
    },
    board: nextBoard,
  };
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

export function determineCombatPower(
  isAttacker: boolean,
  attacker: FighterCard,
  defender: FighterCard,
) {
  const cardDefinition = isAttacker ? attacker : defender;
  const abilities = cardDefinition.abilities.map(
    (a) => abilityDefinitions[a.id],
  );
  const power = abilities.reduce((acc, ability) => {
    if ('modifyCombatPower' in ability.effect) {
      return ability.effect.modifyCombatPower({
        attacker,
        defender,
        basePower: acc,
      });
    }
    return acc;
  }, cardDefinition.power);
  return power;
}

export function resolveCombat(attacker: Card, defender: Card) {
  const attackerDef = cardDefinitions[attacker.cardId as ValidCardId];
  const defenderDef = cardDefinitions[defender.cardId as ValidCardId];
  if (!attackerDef || !defenderDef) {
    throw new Error('Invalid card');
  }
  if (attackerDef.kind !== 'fighter' || defenderDef.kind !== 'fighter') {
    throw new Error('Not a fighter');
  }
  const attackerPower = determineCombatPower(true, attackerDef, defenderDef);
  const defenderPower = determineCombatPower(false, attackerDef, defenderDef);
  if (attackerPower > defenderPower) {
    console.log('attacker wins');
    return attacker;
  } else if (attackerPower < defenderPower) {
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

export function getAdjacentCardInstanceIds(
  board: Board,
  coord: Coordinate,
): string[] {
  const { x, y } = coord;
  const adjacentCoords = [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ];
  const adjacentCards = adjacentCoords
    .filter(
      (c) =>
        c.x >= 0 && c.x < board[0].length && c.y >= 0 && c.y < board.length,
    )
    .map((c) => getTopCard(getStack(board, c)))
    .filter(Boolean);
  return adjacentCards as string[];
}
