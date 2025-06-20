import { GameMember, GameRandom } from '@long-game/game-definition';
import { PieceData, PieceType } from './pieces';

export type Position = {
  x: number;
  y: number;
};
export type SerializedPosition = `${number},${number}`;

export type BoardCell = {
  piece?: PieceData;
  movedHere?: PieceData[]; // used for placements during the active turn
  movedAway?: boolean; // used to track if a piece has moved this turn
};

export type Board = {
  cells: Record<SerializedPosition, BoardCell>;
  size: number;
};

export function serializePosition(position: Position): SerializedPosition {
  return `${position.x},${position.y}`;
}

export function deserializePosition(serialized: string): Position {
  const [x, y] = serialized.split(',').map(Number);
  return { x, y };
}

export function countKings(board: Board, playerId: string) {
  let count = 0;
  for (const cell of Object.values(board.cells)) {
    if (
      cell.piece &&
      cell.piece.type === 'king' &&
      cell.piece.playerId === playerId
    ) {
      count++;
    }
  }
  return count;
}

export function getPiece(
  pieceId: string,
  board: Board,
): { position: Position; piece: PieceData } | undefined {
  const [pos, cell] =
    Object.entries(board.cells).find(
      ([pos, cell]) => cell.piece?.id === pieceId,
    ) ?? [];
  if (pos && cell?.piece) {
    return {
      position: deserializePosition(pos),
      piece: cell.piece,
    };
  }
}

// relative to wherever the game places the player.
// The shape looks like this:
//   p
//  prp
// pbKkp
//  pqp
//   p
const playerPieceInitialShape: { position: Position; type: PieceType }[] = [
  { position: { x: 0, y: -2 }, type: 'pawn' },
  { position: { x: -1, y: -1 }, type: 'pawn' },
  { position: { x: 0, y: -1 }, type: 'rook' },
  { position: { x: 1, y: -1 }, type: 'pawn' },
  { position: { x: -2, y: 0 }, type: 'pawn' },
  { position: { x: -1, y: 0 }, type: 'bishop' },
  { position: { x: 0, y: 0 }, type: 'king' },
  { position: { x: 1, y: 0 }, type: 'knight' },
  { position: { x: 2, y: 0 }, type: 'pawn' },
  { position: { x: -1, y: 1 }, type: 'pawn' },
  { position: { x: 0, y: 1 }, type: 'queen' },
  { position: { x: 1, y: 1 }, type: 'pawn' },
  { position: { x: 0, y: 2 }, type: 'pawn' },
];

const boardSizesByPlayers: Record<number, number> = {
  2: 10,
  3: 12,
  4: 12,
  5: 15,
  6: 21,
  7: 21,
  8: 21,
  9: 21,
};
const playerCenters: Record<number, Position[]> = {
  2: [
    { x: 2, y: 2 },
    { x: 7, y: 7 },
  ],
  3: [
    { x: 2, y: 2 },
    { x: 9, y: 9 },
    { x: 2, y: 9 },
  ],
  4: [
    { x: 2, y: 2 },
    { x: 9, y: 9 },
    { x: 2, y: 9 },
    { x: 9, y: 2 },
  ],
  5: [
    { x: 2, y: 2 },
    { x: 12, y: 12 },
    { x: 2, y: 12 },
    { x: 12, y: 2 },
    { x: 7, y: 7 },
  ],
  6: [
    { x: 2, y: 2 },
    { x: 2, y: 10 },
    { x: 2, y: 18 },
    { x: 18, y: 2 },
    { x: 18, y: 10 },
    { x: 18, y: 18 },
  ],
  7: [
    { x: 2, y: 2 },
    { x: 2, y: 10 },
    { x: 2, y: 18 },
    { x: 18, y: 2 },
    { x: 18, y: 10 },
    { x: 18, y: 18 },
    { x: 10, y: 2 },
  ],
  8: [
    { x: 2, y: 2 },
    { x: 2, y: 10 },
    { x: 2, y: 18 },
    { x: 18, y: 2 },
    { x: 18, y: 10 },
    { x: 18, y: 18 },
    { x: 10, y: 2 },
    { x: 10, y: 18 },
  ],
  9: [
    { x: 2, y: 2 },
    { x: 2, y: 10 },
    { x: 2, y: 18 },
    { x: 18, y: 2 },
    { x: 18, y: 10 },
    { x: 18, y: 18 },
    { x: 10, y: 2 },
    { x: 10, y: 18 },
    { x: 10, y: 10 },
  ],
};
export function getInitialBoard(
  members: GameMember[],
  random: GameRandom,
): Board {
  const size = boardSizesByPlayers[members.length] ?? 21;
  const cells: Record<SerializedPosition, BoardCell> = {};
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      cells[serializePosition({ x, y })] = {};
    }
  }

  const board: Board = { cells, size };

  members.forEach((member, index) => {
    const center = playerCenters[members.length][index];
    playerPieceInitialShape.forEach(({ position, type }) => {
      const piece: PieceData = {
        id: random.id(),
        type,
        playerId: member.id,
      };
      const cellPosition: Position = {
        x: center.x + position.x,
        y: center.y + position.y,
      };
      // sanity check
      if (board.cells[serializePosition(cellPosition)].piece) {
        throw new Error(
          `Invalid board setup: Cell ${serializePosition(cellPosition)} already has a piece for player ${member.id}. This is a bug in Chess Arena!`,
        );
      }
      board.cells[serializePosition(cellPosition)].piece = piece;
    });
  });

  return board;
}
