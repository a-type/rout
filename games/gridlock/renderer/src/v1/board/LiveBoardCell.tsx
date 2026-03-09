import { PrefixedId } from '@long-game/common';
import {
  fromCellKey,
  isValidPlacement,
  PlayerBoardCell,
  Tile,
  toCellKey,
} from '@long-game/game-gridlock-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import clsx from 'clsx';
import { memo } from 'react';
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
    const inHand = gameSuite.initialState.hand.some(
      (t) => t.id === cell?.tile.id,
    );
    const { x, y } = fromCellKey(cellKey);
    const invalid = gameSuite.turnError?.data?.invalidCellKey === cellKey;

    return (
      <BoardGridCell
        x={x}
        y={y}
        className={clsx(invalid && 'palette-attention', className)}
        style={{
          zIndex: cell ? 1 : 0,
        }}
        anchorNamespace={playerId}
      >
        <TokenSpace<Tile>
          className={clsx(
            'transition-all w-full h-full aspect-1 flex items-stretch justify-stretch',
            'layer-components:(border-main/50 border-1px border-solid)',
            'data-[over-accepted=true]:bg-main-light',
            'data-[dragged-accepted=false]:(opacity-50 border-transparent)',
            cell && 'layer-components:bg-white shadow-lg shadow-main',
            cell && 'data-[dragging=true]:scale-80',
            'will-change-transform',
          )}
          id={toCellKey(x, y)}
          tags={['tile']}
          accept={(token) => {
            if (cell && token.data.id !== cell.tile.id) {
              return false;
            }
            const valid = isValidPlacement({
              board: gameSuite.finalState.board,
              newPlacement: {
                tileId: token.data.id,
                cellKey: toCellKey(x, y),
              },
              hand: gameSuite.initialState.hand,
            });
            if (!valid) {
              return false;
            }
            return true;
          }}
          onDrop={(token) => {
            if (cell) return;
            const tileId = token.data.id;
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
              illegal={invalid}
              inHand={inHand}
              playerId={playerId || gameSuite.playerId}
            />
          )}
        </TokenSpace>
      </BoardGridCell>
    );
  }),
);
