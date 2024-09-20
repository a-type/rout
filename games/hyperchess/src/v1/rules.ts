import {
  Board,
  Direction,
  Piece,
  Position,
  SerializedPosition,
} from './gameDefinition.js';

/**
 * Unlike normal chess, there are a few new things:
 * - More than 2 players
 * - Players can be oriented in different directions
 */

type MoveDetails = {
  piece: Piece;
  from: Position;
  to: Position;
  playerDirections: Record<string, Direction>;
  board: Board;
  boardSize: number;
};

export function isValidPieceMove(details: MoveDetails) {
  switch (details.piece.type) {
    case 'pawn':
      return isValidPawnMove(details);
    case 'rook':
      return isValidRookMove(details);
    case 'knight':
      return isValidKnightMove(details);
    case 'bishop':
      return isValidBishopMove(details);
    case 'queen':
      return isValidQueenMove(details);
    case 'king':
      return isValidKingMove(details);
  }
}

export function isValidPawnMove(details: MoveDetails) {
  // for pawns, orientation matters, so it's kind of easier to rotate the
  // whole board and move data so that the player is always moving up.
  details = reorientToPlayer(details);

  const move = {
    x: details.to.x - details.from.x,
    y: details.to.y - details.from.y,
  };

  if (move.x === 0) {
    if (move.y === 1 || (move.y === 2 && details.from.y === 1)) {
      if (details.board[serializePosition(details.to)]) {
        return false;
      }
      return true;
    }
  } else if (Math.abs(move.x) === 1 && move.y === 1) {
    // capture
    if (
      details.board[serializePosition(details.to)]?.playerId !==
      details.piece.playerId
    ) {
      return true;
    }
  }

  return false;
}

export function isValidRookMove(details: MoveDetails) {
  const move = {
    x: details.to.x - details.from.x,
    y: details.to.y - details.from.y,
  };
  if (move.x === 0 || move.y === 0) {
    // is the path blocked?
    let hasSeenOpponent = false;
    const step =
      move.x === 0
        ? { x: 0, y: Math.sign(move.y) }
        : { x: Math.sign(move.x), y: 0 };
    for (
      let x = details.from.x + step.x, y = details.from.y + step.y;
      x !== details.to.x || y !== details.to.y;
      x += step.x, y += step.y
    ) {
      if (
        details.board[serializePosition({ x, y })]?.playerId ===
        details.piece.playerId
      ) {
        // can't move onto or past own piece
        return false;
      } else if (details.board[serializePosition({ x, y })]?.playerId) {
        // can't move past an opponent
        if (hasSeenOpponent) {
          return false;
        }
        hasSeenOpponent = true;
      }
    }
    return true;
  }
  return false;
}

export function isValidKnightMove(details: MoveDetails) {
  const move = {
    x: details.to.x - details.from.x,
    y: details.to.y - details.from.y,
  };
  if (
    (Math.abs(move.x) === 2 && Math.abs(move.y) === 1) ||
    (Math.abs(move.x) === 1 && Math.abs(move.y) === 2)
  ) {
    // cannot land on own piece
    return (
      !details.board[serializePosition(details.to)]?.playerId ||
      details.board[serializePosition(details.to)]?.playerId !==
        details.piece.playerId
    );
  }
  return false;
}

export function isValidBishopMove(details: MoveDetails) {
  const move = {
    x: details.to.x - details.from.x,
    y: details.to.y - details.from.y,
  };
  if (Math.abs(move.x) === Math.abs(move.y)) {
    // is the path blocked?
    let hasSeenOpponent = false;
    const step = { x: Math.sign(move.x), y: Math.sign(move.y) };
    for (
      let x = details.from.x + step.x, y = details.from.y + step.y;
      x !== details.to.x || y !== details.to.y;
      x += step.x, y += step.y
    ) {
      if (
        details.board[serializePosition({ x, y })]?.playerId ===
        details.piece.playerId
      ) {
        // can't move onto or past own piece
        return false;
      } else if (details.board[serializePosition({ x, y })]?.playerId) {
        // can't move past an opponent
        if (hasSeenOpponent) {
          return false;
        }
        hasSeenOpponent = true;
      }
    }
    return true;
  }
  return false;
}

export function isValidQueenMove(details: MoveDetails) {
  return isValidRookMove(details) || isValidBishopMove(details);
}

export function isValidKingMove(details: MoveDetails) {
  const move = {
    x: details.to.x - details.from.x,
    y: details.to.y - details.from.y,
  };
  if (Math.abs(move.x) <= 1 && Math.abs(move.y) <= 1) {
    // cannot land on own piece
    if (
      details.board[serializePosition(details.to)]?.playerId ===
      details.piece.playerId
    ) {
      return false;
    }
    // cannot move into check
    // to check this, make the move, then see if player is in check.
    const board = applyMove(details);
    const playerDirection = details.playerDirections[details.piece.playerId];
    const checks = playerChecks(board, {
      [details.piece.playerId]: playerDirection,
    });
    if (checks.includes(details.piece.playerId)) {
      return false;
    }

    return true;
  }
  return false;
}

export function applyMove(
  details: MoveDetails,
  takenRef: { current?: Piece } = {},
) {
  const board = { ...details.board };
  if (details.board[serializePosition(details.to)]) {
    takenRef.current = details.board[serializePosition(details.to)];
  }
  board[serializePosition(details.to)] = details.piece;
  delete board[serializePosition(details.from)];
  return board;
}

// CHECK, THREATENING, ETC
type ThreatenDetails = {
  // position of the piece that may be threatening
  position: Position;
  // position of piece being checked for threat
  testPosition: Position;
  playerDirection: Direction;
  board: Board;
};
export function pawnThreatens({
  testPosition,
  position,
  playerDirection,
  board,
}: ThreatenDetails) {
  const difference = {
    x: testPosition.x - position.x,
    y: testPosition.y - position.y,
  };
  if (playerDirection.y === -1) {
    return difference.y === -1 && Math.abs(difference.x) === 1;
  } else if (playerDirection.y === 1) {
    return difference.y === 1 && Math.abs(difference.x) === 1;
  } else if (playerDirection.x === -1) {
    return difference.x === -1 && Math.abs(difference.y) === 1;
  } else if (playerDirection.x === 1) {
    return difference.x === 1 && Math.abs(difference.y) === 1;
  }
  return false;
}

export function rookThreatens({
  testPosition,
  position,
  board,
}: ThreatenDetails) {
  const difference = {
    x: testPosition.x - position.x,
    y: testPosition.y - position.y,
  };
  if (difference.x === 0 || difference.y === 0) {
    const step =
      difference.x === 0
        ? { x: 0, y: Math.sign(difference.y) }
        : { x: Math.sign(difference.x), y: 0 };
    for (
      let x = position.x + step.x, y = position.y + step.y;
      x !== testPosition.x || y !== testPosition.y;
      x += step.x, y += step.y
    ) {
      if (board[serializePosition({ x, y })]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export function knightThreatens({ testPosition, position }: ThreatenDetails) {
  const difference = {
    x: testPosition.x - position.x,
    y: testPosition.y - position.y,
  };
  return (
    (Math.abs(difference.x) === 2 && Math.abs(difference.y) === 1) ||
    (Math.abs(difference.x) === 1 && Math.abs(difference.y) === 2)
  );
}

export function bishopThreatens({
  testPosition,
  position,
  board,
}: ThreatenDetails) {
  const difference = {
    x: testPosition.x - position.x,
    y: testPosition.y - position.y,
  };
  if (Math.abs(difference.x) === Math.abs(difference.y)) {
    const step = { x: Math.sign(difference.x), y: Math.sign(difference.y) };
    for (
      let x = position.x + step.x, y = position.y + step.y;
      x !== testPosition.x || y !== testPosition.y;
      x += step.x, y += step.y
    ) {
      if (board[serializePosition({ x, y })]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export function queenThreatens(details: ThreatenDetails) {
  return rookThreatens(details) || bishopThreatens(details);
}

export function kingThreatens({ testPosition, position }: ThreatenDetails) {
  const difference = {
    x: testPosition.x - position.x,
    y: testPosition.y - position.y,
  };
  return Math.abs(difference.x) <= 1 && Math.abs(difference.y) <= 1;
}

export function pieceThreatens(details: ThreatenDetails) {
  switch (details.board[serializePosition(details.position)]?.type) {
    case 'pawn':
      return pawnThreatens(details);
    case 'rook':
      return rookThreatens(details);
    case 'knight':
      return knightThreatens(details);
    case 'bishop':
      return bishopThreatens(details);
    case 'queen':
      return queenThreatens(details);
    case 'king':
      return kingThreatens(details);
  }
}

// computes all players in check
// based on board state
export function playerChecks(
  board: Board,
  playerOrientations: Record<string, Direction>,
) {
  const playersInCheck: string[] = [];
  for (const [posKey, piece] of Object.entries(board)) {
    const position = deserializePosition(posKey);
    if (piece && piece.type === 'king') {
      const playerDirection = playerOrientations[piece.playerId];
      for (const [testPosKey, testPiece] of Object.entries(board)) {
        const testPosition = deserializePosition(testPosKey);
        if (testPiece?.playerId !== piece.playerId) {
          const details = {
            position,
            testPosition,
            playerDirection,
            board,
          };
          if (pieceThreatens(details)) {
            playersInCheck.push(piece.playerId);
            break;
          }
        }
      }
    }
  }

  return playersInCheck;
}

// UTILS

function reorientToPlayer(details: MoveDetails) {
  const boardSize = details.boardSize;
  const playerDirection = details.playerDirections[details.piece.playerId];
  if (playerDirection.x === 0) {
    if (playerDirection.y === -1) {
      return details;
    } else if (playerDirection.y === 1) {
      const newBoard = { ...details.board };
      for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
          newBoard[serializePosition({ x, y })] =
            details.board[serializePosition({ x, y: boardSize - y })];
        }
      }
      return {
        ...details,
        from: { x: boardSize - details.from.x, y: boardSize - details.from.y },
        to: { x: boardSize - details.to.x, y: boardSize - details.to.y },
        board: newBoard,
        playerDirection: { x: 0, y: -1 },
      };
    }
  } else {
    if (playerDirection.x === -1) {
      const newBoard = { ...details.board };
      for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
          newBoard[serializePosition({ x, y })] =
            details.board[serializePosition({ x: boardSize - y, y: x })];
        }
      }
      return {
        ...details,
        from: { x: boardSize - details.from.y, y: details.from.x },
        to: { x: boardSize - details.to.y, y: details.to.x },
        board: newBoard,
        playerDirection: { x: 1, y: 0 },
      };
    } else {
      const newBoard = { ...details.board };
      for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
          newBoard[serializePosition({ x, y })] =
            details.board[serializePosition({ x: y, y: x })];
        }
      }
      return {
        ...details,
        from: { x: details.from.y, y: boardSize - details.from.x },
        to: { x: details.to.y, y: boardSize - details.to.x },
        board: newBoard,
        playerDirection: { x: -1, y: 0 },
      };
    }
  }

  throw new Error(
    'Invalid player direction ' + JSON.stringify(playerDirection),
  );
}

export function serializePosition(position: Position): SerializedPosition {
  return `${position.x},${position.y}`;
}

export function deserializePosition(serialized: string): Position {
  const [x, y] = serialized.split(',').map(Number);
  return { x, y };
}
