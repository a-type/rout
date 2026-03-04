import { PrefixedId } from '@long-game/common';
import {
  fromCellKey,
  PlayerBoardCell,
} from '@long-game/game-gridlock-definition/v1';
import clsx from 'clsx';
import { BoardGridCell } from './BoardGrid';
import { TileRenderer } from './TileRenderer';

export interface ReadonlyBoardCellProps {
  cell: PlayerBoardCell | undefined;
  playerId: PrefixedId<'u'>;
  cellKey: string;
  pathIsBroken?: boolean;
  pathIsComplete?: boolean;
  className?: string;
}

export function ReadonlyBoardCell({
  cell,
  cellKey,
  playerId,
  className,
  ...rest
}: ReadonlyBoardCellProps) {
  const { x, y } = fromCellKey(cellKey);
  return (
    <BoardGridCell
      x={x}
      y={y}
      className={clsx('rd-sm layer-components:bg-white', className)}
      anchorNamespace={playerId}
    >
      {cell && <TileRenderer tile={cell.tile} {...rest} />}
    </BoardGridCell>
  );
}
