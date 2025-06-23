import { clsx } from '@a-type/ui';
import {
  PieceData,
  serializePosition,
  TurnData,
} from '@long-game/game-chess-arena-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { GamePiece } from './GamePiece';

export interface GameBoardProps {
  className?: string;
}

export const GameBoard = hooks.withGame<GameBoardProps>(function GameBoard({
  gameSuite,
  className,
}) {
  const { board } = gameSuite.finalState;

  const getTurn = (piece: PieceData, position: { x: number; y: number }) => {
    return (old: TurnData | null) => {
      if (!old) {
        return {
          placements: [],
          moves: [
            {
              pieceId: piece.id,
              position,
            },
          ],
        };
      } else {
        return {
          ...old,
          moves: [
            ...old.moves.filter((move) => move.pieceId !== piece.id),
            {
              pieceId: piece.id,
              position,
            },
          ],
        };
      }
    };
  };

  return (
    <div
      className={clsx(
        'relative grid grid-cols-[repeat(var(--board-size),1fr)] grid-rows-[repeat(var(--board-size),1fr)]',
        'aspect-1 w-full',
        className,
      )}
      style={{ '--board-size': board.size } as any}
    >
      {new Array(board.size * board.size).fill(null).map((_, index) => {
        const row = Math.floor(index / board.size);
        const col = index % board.size;
        const position = { x: col, y: row };
        const squareColor = (row + col) % 2 === 0 ? 'bg-white' : 'bg-black';
        const cell = board.cells[serializePosition(position)];
        return (
          <TokenSpace<PieceData>
            id={serializePosition(position)}
            onDrop={(token) => {
              if (cell.piece?.id === token.data.id) {
                // If the piece is already in the cell, do nothing
                return;
              }
              gameSuite.prepareTurn(getTurn(token.data, position));
            }}
            key={index}
            className={clsx(
              'flex items-center justify-center',
              'aspect-1 w-full',
              squareColor,
              'border border-default',
              squareColor === 'bg-white'
                ? '[&[data-dragged-accepted=true]]:bg-gray-light'
                : '[&[data-dragged-accepted=true]]:bg-gray-dark',
            )}
            accept={(data) => {
              const error = gameSuite.validatePartialTurn(
                getTurn(data.data, position),
              );
              if (error) {
                return error.message;
              }
              return true;
            }}
          >
            {cell.piece && (
              <GamePiece
                piece={cell.piece}
                className={clsx('w-80%', cell.movedAway && '!opacity-50')}
                variant={cell.movedAway ? 'movedAway' : undefined}
              />
            )}
            {!!cell.movedHere?.length && (
              <div className="absolute inset-0 opacity-50 flex items-center justify-center">
                {cell.movedHere.map((piece) => (
                  <div
                    key={piece.id}
                    className="w-50% h-50% absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] scale-75"
                  >
                    <GamePiece key={piece.id} piece={piece} />
                  </div>
                ))}
              </div>
            )}
          </TokenSpace>
        );
      })}
    </div>
  );
});
