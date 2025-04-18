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
  PlayerState,
  FreeAction,
  Action,
} from './gameDefinition';
import {
  abilityDefinitions,
  EffectInput,
  EffectTargetDefinition,
  Target,
  ValidAbilityId,
} from './abilityDefinition';

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

export function validCoordinate(board: Board, coord: Coordinate): boolean {
  const { x, y } = coord;
  if (x < 0 || x >= board.length || y < 0 || y >= board[0].length) {
    return false;
  }
  return true;
}

// Gets the stack at a position on the board
export function getStack(board: Board, coord: Coordinate): CardStack {
  const { x, y } = coord;
  // return null if out of bounds
  if (!validCoordinate(board, coord)) {
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

export function clearFreeActions(gameState: GlobalState) {
  return {
    ...gameState,
    freeActions: [],
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
  if (card.ownerId !== playerId) {
    return [INVALID_MOVE_CODES.NOT_YOUR_CARD];
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
  if (checkFatigue(card)) {
    reasons.push(INVALID_MOVE_CODES.FATIGUED);
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

export function swapCardPositions(
  board: Board,
  source: Coordinate,
  target: Coordinate,
) {
  const sourceStack = getStack(board, source);
  const targetStack = getStack(board, target);
  const newBoard = [...board];
  newBoard[source.y][source.x] = targetStack;
  newBoard[target.y][target.x] = sourceStack;
  return newBoard;
}

export function findCoordFromCard(
  board: Board,
  cardInstanceId: string,
): Coordinate | null {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const stack = getStack(board, { x, y });
      if (stack && stack.includes(cardInstanceId)) {
        return { x, y };
      }
    }
  }
  return null;
}

const INVALID_TARGET_CODES = {
  NUMBER_OF_TARGETS: 'Invalid target (invalid number of targets)',
  COORDINATE: 'Invalid target (invalid coordinate)',
  OWNER: 'Invalid target (invalid owner)',
} as const;
type InvalidTargetCode = keyof typeof INVALID_TARGET_CODES;
export type InvalidTargetReason =
  (typeof INVALID_TARGET_CODES)[InvalidTargetCode];

export function validateTargets(
  playerState: PlayerState,
  playerId: string,
  targetDefinition: EffectTargetDefinition[],
  targets: Target[],
): InvalidTargetReason[] | null {
  const { cardState, board } = playerState;
  if (targets.length !== targetDefinition.length) {
    return [INVALID_TARGET_CODES.NUMBER_OF_TARGETS];
  }
  const invalidTargets = targets.flatMap((target, idx) => {
    const targetDef = targetDefinition[idx];
    const reasons = [] as InvalidTargetReason[];
    if (target.kind === 'coordinate') {
      const coord = target as Coordinate;
      if (!validCoordinate(board, coord)) {
        reasons.push(INVALID_TARGET_CODES.COORDINATE);
      }
      if (targetDef.controller !== 'any') {
        const stack = getStack(board, coord);
        const topCardId = getTopCard(stack);
        if (targetDef.controller === 'none') {
          if (topCardId) {
            reasons.push(INVALID_TARGET_CODES.OWNER);
          }
        } else if (topCardId) {
          const topCard = cardState[topCardId];
          const controller =
            topCard.ownerId === playerId ? 'player' : 'opponent';
          if (targetDef.controller !== controller) {
            reasons.push(INVALID_TARGET_CODES.OWNER);
          }
        } else {
          reasons.push(INVALID_TARGET_CODES.OWNER);
        }
      }
    }
    return [];
  });
  if (invalidTargets.length === 0) {
    return null;
  }
  return invalidTargets;
}

export function findMatchingFreeAction(
  action: Action,
  freeActions: FreeAction[],
): FreeAction | null {
  const freeAction = freeActions.find((a) => {
    if (action.type !== a.type) {
      return false;
    }
    if (!a.cardInstanceId) {
      return true;
    }
    if (action.type === 'deploy') {
      return a.cardInstanceId === action.card.instanceId;
    }
    if (action.type === 'move') {
      return a.cardInstanceId === action.cardInstanceId;
    }
  });
  return freeAction ?? null;
}

export function spendFreeAction(gameState: GlobalState, action: FreeAction) {
  const freeActions = gameState.freeActions
    .map((a) => {
      if (a !== action) {
        return a;
      }
      if (a.count && a.count > 1) {
        return { ...a, count: a.count - 1 };
      }
      return null;
    })
    .filter(Boolean) as FreeAction[];
  return {
    ...gameState,
    freeActions,
  };
}

export function getAllBoardCoordinates(board: Board): Coordinate[] {
  const coordinates: Coordinate[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      coordinates.push({ x, y });
    }
  }
  return coordinates;
}
