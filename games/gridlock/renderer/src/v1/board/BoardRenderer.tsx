import {
  boardSize,
  fromCellKey,
  getDistinctPaths,
  isValidPlacement,
  pathsToLookup,
  PlayerBoardCell,
  Tile,
  toCellKey,
} from '@long-game/game-gridlock-definition/v1';
import { TokenSpace, useDraggedToken } from '@long-game/game-ui';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { hooks } from '../gameClient.js';
import { TileRenderer } from './TileRenderer.js';

export interface BoardRendererProps {}

export const BoardRenderer = hooks.withGame<BoardRendererProps>(
  function BoardRenderer({ gameSuite }) {
    const { board } = gameSuite.finalState;
    const invalidCellKey = gameSuite.turnError?.data?.invalidCellKey;
    const paths = getDistinctPaths(board);
    const pathLookup = pathsToLookup(paths);

    return (
      <div
        className="grid w-full max-w-90vw max-h-80vh aspect-1 bg-main-wash p-xs gap-xs"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
        }}
      >
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
        {paths.map((path) => {
          if (!path.brokenAt || !path.brokenAtDirection) return null;
          const { x, y } = fromCellKey(path.brokenAt);
          return (
            <BrokenMarker
              key={path.brokenAt}
              x={x}
              y={y}
              direction={path.brokenAtDirection}
            />
          );
        })}
      </div>
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
      <TokenSpace<Tile>
        style={{
          anchorName: `--cell-${x}-${y}`,
        }}
        className={clsx(
          'w-full h-full rounded-sm flex items-stretch justify-stretch',
          'data-[over-accepted=true]:bg-main-light',
          cell && 'bg-white',
          invalid && 'ring-attention ring-2',
          pathIsBroken && 'palette-gray',
          pathIsComplete && 'palette-success',
          !willAcceptDraggedTile && 'scale-85 opacity-50',
          willAcceptDraggedTile && draggedTile && 'ring-main-dark ring-2',
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
          <TileRenderer
            tile={cell.tile}
            className="layer-components:(w-full h-full)"
          />
        )}
      </TokenSpace>
    );
  }),
);

const BrokenMarker = ({
  direction,
  x,
  y,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  x: number;
  y: number;
}) => {
  return (
    <div
      style={{
        positionAnchor: `--cell-${x}-${y}`,
        top: 'anchor(top)',
        left: 'anchor(left)',
        right: 'anchor(right)',
        bottom: 'anchor(bottom)',
      }}
      className="fixed pointer-events-none"
    >
      <div
        className={clsx(
          'absolute flex items-center justify-center color-white font-bold leading-none',
          'bg-attention w-[16px] h-[16px] rounded-full',
          direction === 'up' && 'top-0 left-1/2 -translate-x-1/2',
          direction === 'down' && 'bottom-0 left-1/2 -translate-x-1/2',
          direction === 'left' && 'left-0 top-1/2 -translate-y-1/2',
          direction === 'right' && 'right-0 top-1/2 -translate-y-1/2',
        )}
      >
        ×
      </div>
    </div>
  );
};
