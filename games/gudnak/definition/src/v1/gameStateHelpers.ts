import { cardDefinitions, ValidCardId } from './cardDefinition';
import {
  Card,
  CardStack,
  Coordinate,
  type GlobalState,
} from './gameDefinition';

function fisherYatesShuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  playerId: string,
): GlobalState {
  const { deck, ...playerState } = globalState.playerState[playerId];
  return {
    ...globalState,
    playerState: {
      ...globalState.playerState,
      [playerId]: {
        ...playerState,
        deck: fisherYatesShuffle(deck),
      },
    },
  };
}

// Gets the stack at a position on the board
export function getStack(
  globalState: GlobalState,
  coord: Coordinate,
): CardStack {
  const { board } = globalState;
  const { x, y } = coord;
  // return null if out of bounds
  if (x < 0 || x >= board.length || y < 0 || y >= board[0].length) {
    throw new Error('Out of bounds');
  }
  return board[x][y];
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
  globalState: GlobalState,
  cardId: string,
  target: Coordinate,
): boolean {
  const stack = getStack(globalState, target);
  if (stack.length === 0) {
    return true;
  }
  const topCard = stack[stack.length - 1];
  const topCardId = topCard.cardId;
  return matchingTag(topCardId as ValidCardId, cardId as ValidCardId);
}

export function deploy(
  globalState: GlobalState,
  card: Card,
  target: Coordinate,
): GlobalState {
  if (!canDeploy(globalState, card.cardId, target)) {
    throw new Error('Invalid deploy');
  }
  const { x, y } = target;
  const { board } = globalState;
  const stack = board[y][x];
  const newStack = [...stack, card];
  const newBoard = [...board];
  newBoard[x][y] = newStack;
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
