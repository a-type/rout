import { PrefixedId } from '@long-game/common';
import {
  BaseTurnError,
  GameDefinition,
  roundFormat,
} from '@long-game/game-definition';
import {
  Board,
  countKings,
  deserializePosition,
  getInitialBoard,
  Position,
  serializePosition,
} from './board';
import { Capture, getPlayerScores } from './captures';
import {
  getMovePath,
  isValidPieceMove,
  MoveBlock,
  PlayerMove,
  PlayerPlacement,
  toMoveDetails,
} from './moves';
import { PieceType } from './pieces';

export type GlobalState = {
  board: Board;
  captures: Capture[]; // used for scoring and showing what happened last round
  blocksLastRound: MoveBlock[];
  // TODO: powerups
};

export type PlayerState = Pick<GlobalState, 'board' | 'blocksLastRound'> & {
  placements: PieceType[];
  capturesLastRound: Capture[];
};

export type TurnData = {
  moves: PlayerMove[];
  placements: PlayerPlacement[];
};

export type TurnError = BaseTurnError & {
  data?: {
    position?: Position;
  };
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData,
  TurnError
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 9,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validatePartialTurn: ({ playerState, turn }) => {
    const targetPositions = new Set<string>();
    for (const move of turn.data.moves) {
      const serializedPosition = serializePosition(move.position);
      if (targetPositions.has(serializedPosition)) {
        return {
          code: 'duplicate-move',
          message: `You cannot move multiple pieces to the same position.`,
          data: {
            position: move.position,
          },
        };
      }
      targetPositions.add(serializedPosition);
    }

    // validate each piece move
    for (const move of turn.data.moves) {
      const details = toMoveDetails(
        move.pieceId,
        move.position,
        playerState.board,
      );
      if (!details) {
        return {
          code: 'invalid-move',
          message: `The moved piece was not found on the board.`,
        };
      }
      if (details.piece.playerId !== turn.playerId) {
        return {
          code: 'invalid-move',
          message: `You cannot move a piece that does not belong to you.`,
          data: {
            position: details.from,
          },
        };
      }
      if (!isValidPieceMove(details)) {
        return {
          code: 'invalid-move',
          message: `That piece can't move there.`,
          data: {
            position: details.from,
          },
        };
      }
    }
  },
  validateTurn: ({ playerState, turn }) => {
    const moveCount = 1 + countKings(playerState.board, turn.playerId);
    if (turn.data.moves.length > moveCount) {
      return {
        code: 'too-many-moves',
        message: `You can only make ${moveCount} moves this turn.`,
      };
    }
    if (turn.data.moves.length < moveCount) {
      return {
        code: 'too-few-moves',
        message: `You must make at least ${moveCount} moves this turn.`,
      };
    }
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    let newBoard = structuredClone(playerState.board);
    for (const move of prospectiveTurn.data.moves) {
      const details = toMoveDetails(move.pieceId, move.position, newBoard);
      if (!details) {
        continue; // skip invalid moves
      }
      newBoard.cells[serializePosition(details.from)].movedAway = true;
      newBoard.cells[serializePosition(details.to)].movedHere = [details.piece];
    }
    return {
      board: newBoard,
      capturesLastRound: playerState.capturesLastRound,
      blocksLastRound: playerState.blocksLastRound,
      // TODO: powerups
      placements: [],
    };
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
    return {
      board: getInitialBoard(members, random),
      captures: [],
      blocksLastRound: [],
    };
  },

  getPlayerState: ({ globalState, roundIndex, playerId }) => {
    return {
      board: globalState.board,
      capturesLastRound: globalState.captures.filter(
        (cap) => cap.roundIndex === roundIndex - 1,
      ),
      blocksLastRound: globalState.blocksLastRound,
      placements: [],
      // TODO: powerups
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    const newBoard = structuredClone(globalState.board);

    // step 1: check for 'blocks' -- where a piece moves in the way of the path
    // of another simultaneous move. if a piece's path gets blocked, we cut
    // it short.
    const blocks: MoveBlock[] = [];
    for (const turn of round.turns) {
      for (const move of turn.data.moves) {
        const details = toMoveDetails(move.pieceId, move.position, newBoard);
        if (!details) {
          continue; // skip invalid moves
        }
        const { path, direction } = getMovePath(details);
        if (!path.length) {
          continue; // no path to block
        }
        const pathSet = new Set(path.map(serializePosition));
        for (const otherTurn of round.turns) {
          if (otherTurn.playerId === turn.playerId) {
            continue; // don't check against your own moves
          }
          for (const otherMove of otherTurn.data.moves) {
            if (pathSet.has(serializePosition(otherMove.position))) {
              // this other move is blocking the path of the current move
              // we cut the path short by adding the reversed path direction to
              // the blocked position.
              move.position = {
                x: otherMove.position.x - direction.x,
                y: otherMove.position.y - direction.y,
              };
              blocks.push({
                blockingPieceId: otherMove.pieceId,
                position: otherMove.position,
                blockedPieceId: move.pieceId,
              });
            }
          }
        }
      }
    }

    // step 2: apply all player moves to the 'movedHere' and 'movedAway' properties
    // of each cell to be reconciled at the end.
    for (const turn of round.turns) {
      for (const move of turn.data.moves) {
        const details = toMoveDetails(move.pieceId, move.position, newBoard);
        if (!details) {
          continue; // skip invalid moves
        }
        newBoard.cells[serializePosition(details.from)].movedAway = true;
        newBoard.cells[serializePosition(details.to)].movedHere ||= [];
        newBoard.cells[serializePosition(details.to)].movedHere!.push(
          details.piece,
        );

        // TODO: resolve powerup piece placement here. we want dropped-in pieces
        // to be in place and treated as if they were already there for the resolution phase.
      }
    }

    // step 3: resolve cells
    const newCaptures = structuredClone(globalState.captures);
    for (const [rawPosition, cell] of Object.entries(newBoard.cells)) {
      const position = deserializePosition(rawPosition);
      if (cell.movedAway) {
        // if a piece was moved away, we first remove it from the cell
        delete cell.piece;
      }
      if (cell.movedHere?.length) {
        if (cell.piece) {
          // we will be taking the existing piece, but must still resolve M.A.D.
          if (cell.movedHere.length === 1) {
            const capturingPiece = cell.movedHere[0];
            newCaptures.push({
              piece: cell.piece,
              position,
              playerId: capturingPiece.playerId,
              roundIndex: round.roundIndex,
            });
            cell.piece = cell.movedHere[0];
          } else {
            // multiple pieces moved here, triggering M.A.D., but all involved
            // players get a capture on the original piece.
            for (const capturingPiece of cell.movedHere) {
              newCaptures.push({
                piece: cell.piece!,
                position,
                playerId: capturingPiece.playerId,
                roundIndex: round.roundIndex,
              });
              // and add a capture for every other piece that moved here
              for (const otherPiece of cell.movedHere) {
                if (otherPiece.playerId !== capturingPiece.playerId) {
                  newCaptures.push({
                    piece: otherPiece,
                    position,
                    playerId: capturingPiece.playerId,
                    roundIndex: round.roundIndex,
                  });
                }
              }
            }
            // no piece claims the cell due to M.A.D.
            delete cell.piece;
          }
        } else {
          if (cell.movedHere.length === 1) {
            // easy, just place the piece
            cell.piece = cell.movedHere[0];
          } else {
            // another M.A.D. situation, but no piece to capture.
            for (const capturingPiece of cell.movedHere) {
              for (const otherPiece of cell.movedHere) {
                if (otherPiece.playerId !== capturingPiece.playerId) {
                  newCaptures.push({
                    piece: otherPiece,
                    position,
                    playerId: capturingPiece.playerId,
                    roundIndex: round.roundIndex,
                  });
                }
              }
            }
            // no piece claims the cell due to M.A.D.
          }
        }
      }
    }

    return {
      board: newBoard,
      captures: newCaptures,
      blocksLastRound: blocks,
    };
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full turn data into what players can see
    // (i.e. what should you know about other players' turns?)
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    const playerScores = getPlayerScores(globalState.captures);
    const winningPlayers = Object.entries(playerScores)
      .filter(([, score]) => score >= 100)
      .map(([playerId]) => playerId as PrefixedId<'u'>);

    if (winningPlayers.length > 0) {
      return {
        status: 'complete',
        winnerIds: winningPlayers,
      };
    }

    return {
      status: 'active',
    };
  },
};
