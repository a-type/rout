import { PrefixedId } from '@long-game/common';
import clsx from 'clsx';
import { fromCellKey, PlayerBoardCell } from '../../definition/index';
import { BoardGridCell } from './BoardGrid';
import cls from './ReadonlyBoardCell.module.css';
import { TileToken } from './TileToken';

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
      className={clsx(cls.root, className)}
      anchorNamespace={playerId}
    >
      {cell && (
        <TileToken tile={cell.tile} playerId={playerId} disabled {...rest} />
      )}
    </BoardGridCell>
  );
}
