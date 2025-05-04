import type {
  Board,
  CardStack,
  Coordinate,
  Side,
  GlobalState,
  Space,
} from '../gameDefinition';

export function getTopCardInstanceIdAtCoordinate(
  board: Board,
  coord: Coordinate,
): string | null {
  const stack = getStack(board, coord);
  return getTopCard(stack);
}

export function getTopCard(stack: CardStack | null) {
  if (!stack || stack.length === 0) {
    return null;
  }
  return stack[stack.length - 1];
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

export function addCardToStack(
  board: Board,
  coord: Coordinate,
  cardInstanceId: string,
): Board {
  const { x, y } = coord;
  const stack = getStack(board, coord);
  const newStack = [...stack, cardInstanceId];
  const newBoard = [...board];
  newBoard[y][x] = newStack;
  return newBoard;
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

export function getAdjacentCoordinates(
  board: Board,
  coord: Coordinate,
): Coordinate[] {
  const { x, y } = coord;
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ].filter((c) => validCoordinate(board, c));
}

export function getAdjacentCardInstanceIds(
  board: Board,
  coord: Coordinate,
): string[] {
  const adjacentCoords = getAdjacentCoordinates(board, coord);
  const adjacentCards = adjacentCoords
    .map((c) => getTopCard(getStack(board, c)))
    .filter(Boolean);
  return adjacentCards as string[];
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

export function getAllBoardCoordinates(board: Board): Coordinate[] {
  const coordinates: Coordinate[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      coordinates.push({ x, y });
    }
  }
  return coordinates;
}
