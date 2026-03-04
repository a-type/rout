import { PrefixedId } from '@long-game/common';
import {
  fromCellKey,
  isValidPlacement,
  PlayerBoardCell,
  Tile,
  toCellKey,
} from '@long-game/game-gridlock-definition/v1';
import { TokenSpace, useDraggedToken } from '@long-game/game-ui';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { hooks } from '../gameClient.js';
import { BoardGridCell } from './BoardGrid.js';
import { TileToken } from './TileToken.js';

export const LiveBoardCell = memo(
  hooks.withGame<{
    cell: PlayerBoardCell | undefined;
    cellKey: string;
    pathIsBroken?: boolean;
    pathIsComplete?: boolean;
    playerId?: PrefixedId<'u'>;
    className?: string;
  }>(function BoardCell({
    cell,
    cellKey,
    gameSuite,
    pathIsBroken,
    pathIsComplete,
    playerId,
    className,
  }) {
    const { x, y } = fromCellKey(cellKey);
    const invalid = gameSuite.turnError?.data?.invalidCellKey === cellKey;
    const draggedTile = useDraggedToken<Tile>();
    const willAcceptDraggedTile = useMemo(() => {
      if (!draggedTile) return true;
      if (cell) {
        return draggedTile.id === cell.tile.id;
      }
      const valid = isValidPlacement({
        board: gameSuite.finalState.board,
        newPlacement: {
          tileId: draggedTile.id,
          cellKey: toCellKey(x, y),
        },
        hand: gameSuite.initialState.hand,
      });
      if (!valid) {
        return false;
      }
      return true;
    }, [draggedTile, cell, gameSuite, x, y]);

    return (
      <BoardGridCell
        x={x}
        y={y}
        className={clsx(
          'w-full h-full border-main-light border-thin border-solid rd-sm',
          cell && 'layer-components:bg-white',
          invalid && 'ring-attention ring-2',
          !willAcceptDraggedTile && 'opacity-50 border-transparent',
          className,
        )}
        anchorNamespace={playerId}
      >
        <TokenSpace<Tile>
          className={clsx(
            'w-full h-full flex items-stretch justify-stretch',
            'data-[over-accepted=true]:bg-main-light',
          )}
          id={toCellKey(x, y)}
          tags={['tile']}
          accept={(token) => {
            if (cell && token.data.id !== cell.tile.id) {
              return false;
            }
            return true;
          }}
          onDrop={(token) => {
            if (cell) return;
            const tileId = token.id;
            gameSuite.prepareTurn((cur) => {
              return {
                placements: [
                  ...cur.placements.filter((p) => p.tileId !== tileId),
                  { tileId, cellKey: toCellKey(x, y) },
                ],
              };
            });
          }}
        >
          {cell && (
            <TileToken
              tile={cell.tile}
              className="layer-components:(w-full h-full)"
              pathIsBroken={pathIsBroken}
              pathIsComplete={pathIsComplete}
            />
          )}
        </TokenSpace>
      </BoardGridCell>
    );
  }),
);
