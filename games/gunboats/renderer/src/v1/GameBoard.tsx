import { clsx } from '@a-type/ui';
import {
  Action,
  serializePosition,
} from '@long-game/game-gunboats-definition/v1';
import { TokenSpace, Viewport } from '@long-game/game-ui';
import { hooks } from './gameClient';

export interface GameBoardProps {
  className?: string;
}

const cellSize = 80;

export const GameBoard = hooks.withGame<GameBoardProps>(function GameBoard({
  className,
  gameSuite,
}) {
  const boardSize = gameSuite.finalState.board.size;
  const viewport = {
    zoomLimits: {
      min: 'fit',
      max: 3,
    },
    defaultZoom: 1,
    panLimitMode: 'viewport',
    panLimits: {
      min: {
        x: -(boardSize / 2) * cellSize,
        y: -(boardSize / 2) * cellSize,
      },
      max: {
        x: (boardSize / 2) * cellSize,
        y: (boardSize / 2) * cellSize,
      },
    },
  } as const;

  return (
    <Viewport className={className}>
      <div
        className={clsx(
          'relative grid grid-cols-[repeat(var(--size),var(--cell-size))] grid-rows-[repeat(var(--size),var(--cell-size))] bg-wash',
          'aspect-1',
        )}
        style={{ '--size': boardSize, '--cell-size': cellSize + 'px' } as any}
      >
        {new Array(boardSize * boardSize).fill(null).map((_, index) => {
          const row = Math.floor(index / boardSize);
          const col = index % boardSize;
          const position = { x: col, y: row };
          const cell =
            gameSuite.finalState.board.cells[serializePosition(position)];
          return (
            <TokenSpace<Action>
              id={serializePosition(position)}
              key={serializePosition(position)}
              className={clsx(
                'border border-default border-solid border-gray bg-primary-wash',
                'flex items-center justify-center',
                'w-[var(--cell-size)] h-[var(--cell-size)]',
              )}
              onDrop={(token) => {}}
            >
              {cell?.shipPart && <div className="w-full h-full bg-black" />}
            </TokenSpace>
          );
        })}
      </div>
    </Viewport>
  );
});
