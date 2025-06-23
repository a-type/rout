import { clsx } from '@a-type/ui';
import { serializePosition } from '@long-game/game-gunboats-definition/v1';
import { Viewport } from '@long-game/game-ui';
import { ActionOrientationControl } from './ActionOrientationControl';
import { CELL_SIZE } from './constants';
import { GameBoardCell } from './GameBoardCell';
import { hooks } from './gameClient';

export interface GameBoardProps {
  className?: string;
}

export const GameBoard = hooks.withGame<GameBoardProps>(function GameBoard({
  className,
  gameSuite,
}) {
  const boardSize = gameSuite.finalState.board.size;

  return (
    <Viewport
      className={className}
      style={{ '--size': boardSize, '--cell-size': CELL_SIZE + 'px' } as any}
    >
      <div
        className={clsx(
          'relative grid grid-cols-[repeat(var(--size),var(--cell-size))] grid-rows-[repeat(var(--size),var(--cell-size))] bg-wash',
          'aspect-1',
        )}
      >
        {new Array(boardSize * boardSize).fill(null).map((_, index) => {
          const position = {
            x: index % boardSize,
            y: Math.floor(index / boardSize),
          };
          return (
            <GameBoardCell
              key={serializePosition(position)}
              position={position}
            />
          );
        })}
      </div>
      <ActionOrientationControl className="shadow-lg" />
    </Viewport>
  );
});
