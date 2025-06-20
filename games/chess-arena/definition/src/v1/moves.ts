import { PrefixedId } from '@long-game/common';
import {
  Board,
  deserializePosition,
  getPiece,
  Position,
  serializePosition,
} from './board';
import { PieceData, PieceType } from './pieces';

export type PlayerMove = {
  pieceId: string;
  position: Position;
};

export type PlayerPlacement = {
  pieceType: PieceType;
  position: Position;
};

export type MoveBlock = {
  blockingPieceId: string;
  blockedPieceId: string;
  position: Position;
};

/**
 * Unlike normal chess, there are a few new things:
 * - More than 2 players
 * - Pawns can move in any direction
 * - Players can have any number of kings
 * - Kings can be captured (but must still move if in check; only checkmate can capture)
 * - Kings being captured does not end the game
 * - Players get 1 extra move per king owned
 * - No en passant
 * - No castling
 */

type MoveDetails = {
  piece: PieceData;
  from: Position;
  to: Position;
  board: Board;
};

/**
 * Converts a piece ID and target position into a MoveDetails object.
 * Does not validate the move.
 */
export function toMoveDetails(pieceId: string, target: Position, board: Board) {
  const found = getPiece(pieceId, board);
  if (!found) {
    return null;
  }
  return {
    piece: found.piece,
    from: found.position,
    to: target,
    board,
  } satisfies MoveDetails;
}

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
  const move = {
    x: details.to.x - details.from.x,
    y: details.to.y - details.from.y,
  };
  const totalDistance = Math.abs(move.x) + Math.abs(move.y);

  const targetCell = details.board.cells[serializePosition(details.to)];

  if (totalDistance === 1) {
    if (targetCell.piece && !targetCell.movedAway) {
      return false;
    }
    return true;
  } else if (Math.abs(move.x) === 1 && Math.abs(move.y) === 1) {
    // capture
    if (
      targetCell.piece &&
      targetCell.piece?.playerId !== details.piece.playerId
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
        details.board.cells[serializePosition({ x, y })]?.piece?.playerId ===
        details.piece.playerId
      ) {
        // can't move onto or past own piece
        return false;
      } else if (
        details.board.cells[serializePosition({ x, y })]?.piece?.playerId
      ) {
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
      !details.board.cells[serializePosition(details.to)]?.piece?.playerId ||
      details.board.cells[serializePosition(details.to)]?.piece?.playerId !==
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
        details.board.cells[serializePosition({ x, y })]?.piece?.playerId ===
        details.piece.playerId
      ) {
        // can't move onto or past own piece
        return false;
      } else if (
        details.board.cells[serializePosition({ x, y })]?.piece?.playerId
      ) {
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
      details.board.cells[serializePosition(details.to)]?.piece?.playerId ===
      details.piece.playerId
    ) {
      return false;
    }
    // cannot move into check
    // to check this, make the move, then see if player is in check.
    const newBoard = structuredClone(details.board);
    newBoard.cells[serializePosition(details.from)].piece = undefined;
    newBoard.cells[serializePosition(details.to)].piece = details.piece;
    const checks = getCheckedKings(newBoard, details.piece.playerId);
    if (checks.some((piece) => piece.id === details.piece.id)) {
      return false;
    }

    return true;
  }
  return false;
}

/**
 * Returns all spaces the piece will 'traverse' during a move.
 * We can use this path to detect blocks from simultaneous moves.
 * Note that knights don't have a path, they jump.
 * NOTE: path does not include start or end positions, these aren't
 *  relevant for its intended use case.
 */
export function getMovePath(details: MoveDetails) {
  // make sure the move is valid
  if (!isValidPieceMove(details)) {
    return { path: [], direction: { x: 0, y: 0 } };
  }
  switch (details.piece.type) {
    case 'pawn':
    case 'king':
    case 'knight':
      return { path: [], direction: { x: 0, y: 0 } };
    case 'rook':
    case 'bishop':
    case 'queen': {
      const path: Position[] = [];
      const direction = {
        x: Math.sign(details.to.x - details.from.x),
        y: Math.sign(details.to.y - details.from.y),
      };
      let current = {
        x: details.from.x + direction.x,
        y: details.from.y + direction.y,
      };
      while (current.x !== details.to.x || current.y !== details.to.y) {
        path.push({ ...current });
        current.x += direction.x;
        current.y += direction.y;
      }
      return { path, direction };
    }
  }
}

// CHECK, THREATENING, ETC
type ThreatenDetails = {
  // position of the piece that may be threatening
  position: Position;
  // position of piece being checked for threat
  testPosition: Position;
  board: Board;
};
export function pawnThreatens({
  testPosition,
  position,
  board,
}: ThreatenDetails) {
  // pawns can take in any adjacent diagonal in this game
  return (
    Math.abs(testPosition.x - position.x) === 1 &&
    Math.abs(testPosition.y - position.y) === 1
  );
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
      if (board.cells[serializePosition({ x, y })]?.piece) {
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
      if (board.cells[serializePosition({ x, y })]?.piece) {
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
  switch (
    details.board.cells[serializePosition(details.position)]?.piece?.type
  ) {
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
    default:
      return false;
  }
}

// Finds all kings owned by this player that are in check
export function getCheckedKings(board: Board, playerId: PrefixedId<'u'>) {
  const kingsInCheck: PieceData[] = [];
  for (const [posKey, cell] of Object.entries(board.cells)) {
    const position = deserializePosition(posKey);
    const piece = cell.piece;
    if (piece && piece.playerId === playerId && piece.type === 'king') {
      for (const [testPosKey, testCell] of Object.entries(board.cells)) {
        const testPiece = testCell.piece;
        const testPosition = deserializePosition(testPosKey);
        if (testPiece?.playerId !== piece.playerId) {
          const details = {
            position,
            testPosition,
            board,
          };
          if (pieceThreatens(details)) {
            kingsInCheck.push(piece);
            break;
          }
        }
      }
    }
  }

  return kingsInCheck;
}
