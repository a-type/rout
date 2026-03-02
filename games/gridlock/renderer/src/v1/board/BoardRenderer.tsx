import {
  boardSize,
  getDistinctPaths,
  isValidPlacement,
  pathsToLookup,
  PlayerBoard,
  PlayerBoardCell,
  Tile,
  toCellKey,
} from '@long-game/game-gridlock-definition/v1';
import { TokenSpace, useDraggedToken } from '@long-game/game-ui';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { hooks } from '../gameClient.js';
import { BoardGrid, BoardGridCell } from './BoardGrid.js';
import { PathsBrokenMarkers } from './PathsBrokenMarkers.js';
import { TileToken } from './TileToken.js';

export interface BoardRendererProps {
  board: PlayerBoard;
  className?: string;
}

export const BoardRenderer = hooks.withGame<BoardRendererProps>(
  function BoardRenderer({ gameSuite, board, className }) {
    const invalidCellKey = gameSuite.turnError?.data?.invalidCellKey;
    const paths = getDistinctPaths(board);
    const pathLookup = pathsToLookup(paths);

    return (
      <BoardGrid className={className}>
        {new Array(boardSize).fill(0).map((_, y) => (
          <Fragment key={y}>
            {new Array(boardSize).fill(0).map((_, x) => {
              const key = toCellKey(x, y);
              const invalid = key === invalidCellKey;
              const cell = board[key];
              const path = pathLookup[key];
              return (
                <BoardCell
                  key={key}
                  cell={cell}
                  x={x}
                  y={y}
                  invalidPlacement={invalid}
                  pathIsBroken={!!path?.brokenAt}
                  pathIsComplete={path?.isComplete}
                />
              );
            })}
          </Fragment>
        ))}
        <PathsBrokenMarkers paths={paths} />
      </BoardGrid>
    );
  },
);

const BoardCell = memo(
  hooks.withGame<{
    cell: PlayerBoardCell | undefined;
    x: number;
    y: number;
    invalidPlacement?: boolean;
    pathIsBroken?: boolean;
    pathIsComplete?: boolean;
  }>(function BoardCell({
    cell,
    x,
    y,
    gameSuite,
    invalidPlacement: invalid,
    pathIsBroken,
    pathIsComplete,
  }) {
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
          cell && 'bg-white',
          invalid && 'ring-attention ring-2',
          !willAcceptDraggedTile && 'opacity-50 border-transparent',
        )}
      >
        <TokenSpace<Tile>
          className={clsx(
            'w-full h-full flex items-stretch justify-stretch',
            'data-[over-accepted=true]:bg-main-light',
          )}
          id={toCellKey(x, y)}
          accept={(token) => {
            // if (!willAcceptDraggedTile) return false;
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
