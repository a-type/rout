import { GameDefinition, Turn, roundFormat } from '@long-game/game-definition';
import { GameRound } from '@long-game/common';
import { lazy } from 'react';
import { applyMove, isValidPieceMove, serializePosition } from './rules.js';

export type PieceType =
  | 'pawn'
  | 'rook'
  | 'knight'
  | 'bishop'
  | 'queen'
  | 'king';

export type Position = { x: number; y: number };
export type Direction = { x: -1 | 1 | 0; y: -1 | 1 | 0 };

export type SerializedPosition = `${number},${number}`;

export type Piece = {
  id: string;
  type: PieceType;
  playerId: string;
};

export type Board = Record<SerializedPosition, Piece>;

export type GlobalState = {
  board: Board;
  boardSize: number;
  playerDirections: Record<string, Direction>;
};

// no hidden info in this game.
export type PlayerState = GlobalState;

export type Move = {
  from: Position;
  to: Position;
};

export type TurnData = {
  moves: Move[];
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 4,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    let movedPieces: Record<string, boolean> = {};
    for (const move of turn.data.moves) {
      const piece = playerState.board[serializePosition(move.from)];
      if (!piece) {
        return 'No piece at that position';
      }
      if (piece.playerId !== turn.userId) {
        return 'Not your piece';
      }
      if (
        !isValidPieceMove({
          board: playerState.board,
          from: move.from,
          piece,
          playerDirections: playerState.playerDirections,
          to: move.to,
          boardSize: playerState.boardSize,
        })
      ) {
        return 'That piece cannot move there';
      }
      if (movedPieces[piece.id]) {
        return 'You can only move a piece once per round';
      }
      movedPieces[piece.id] = true;
    }
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    const newBoard = prospectiveTurn.data.moves.reduce(
      (board, move) =>
        applyMove({
          ...playerState,
          board,
          ...move,
          piece: board[serializePosition(move.from)],
        }),
      playerState.board,
    );
    return {
      ...playerState,
      board: newBoard,
    };
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    const board: Board = {};
    const playerDirections: Record<string, Direction> = members.reduce(
      (acc, member, index) => ({
        ...acc,
        [member.id]: {
          x: 0,
          y: index === 0 ? 1 : -1,
        },
      }),
      {},
    );
    for (let p = 0; p < members.length; p++) {
      const player = members[p];
      for (let x = 0; x < 8; x++) {
        board[`${x},${p}`] = {
          id: `${player.id}-pawn-${x}`,
          type: 'pawn',
          playerId: player.id,
        };
      }
    }

    return {
      board,
      boardSize: 8,
      playerDirections,
    };
  },

  getPlayerState: ({ globalState }) => {
    return globalState;
  },

  getState: ({ initialState, random, rounds }) => {
    return rounds.reduce(applyRoundToGlobalState, {
      ...initialState,
    });
  },

  getPublicTurn: ({ turn }) => {
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    // TODO: win condition
    return {
      status: 'active',
    };
  },
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Turn<TurnData>>,
) => {
  // phase 1: if more than one player moves to the same position in the
  // same round, both pieces are removed from the board
  const destinations: Record<SerializedPosition, string[]> = {};
  for (const turn of round.turns) {
    for (const move of turn.data.moves) {
      const destination = serializePosition(move.to);
      destinations[destination] = destinations[destination] || [];
      destinations[destination].push(turn.userId);
    }
  }
  // we will use the destinations object to remove pieces from the board
  // as needed while applying moves.

  // a map of playerId->pieces taken by that player
  const takes: Record<string, Piece[]> = {};
  const newBoard = round.turns.reduce(
    (board, turn) =>
      turn.data.moves.reduce((board, move) => {
        const takenRef: { current?: Piece } = { current: undefined };
        const appliedBoard = applyMove(
          {
            ...globalState,
            board,
            ...move,
            // piece is always taken from original board, since you can't move
            // the same piece twice in one round.
            piece: globalState.board[serializePosition(move.from)],
          },
          takenRef,
        );

        if (takenRef.current) {
          takes[turn.userId] = takes[turn.userId] || [];
          takes[turn.userId].push(takenRef.current);
        }

        if (destinations[serializePosition(move.to)].length > 1) {
          // this is a contested space. the piece is considered taken by
          // all other players that moved here
          for (const otherPlayer of destinations[serializePosition(move.to)]) {
            if (otherPlayer === turn.userId) {
              continue;
            }
            takes[otherPlayer] = takes[otherPlayer] || [];
            takes[otherPlayer].push(appliedBoard[serializePosition(move.to)]);
            delete appliedBoard[serializePosition(move.to)];
          }
        }

        return appliedBoard;
      }, board),
    globalState.board,
  );

  return {
    ...globalState,
    board: newBoard,
  };
};
