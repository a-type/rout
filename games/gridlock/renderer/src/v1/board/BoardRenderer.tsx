import { boardSize, toCellKey } from '@long-game/game-gridlock-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { Fragment } from 'react/jsx-runtime';
import { hooks } from '../gameClient.js';
import { TileRenderer } from './TileRenderer.js';

export interface BoardRendererProps {}

export const BoardRenderer = hooks.withGame<BoardRendererProps>(
  function BoardRenderer({ gameSuite }) {
    const { board } = gameSuite.finalState;
    return (
      <div
        className="grid w-full aspect-1 bg-main-wash p-xs gap-xs"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
        }}
      >
        {new Array(boardSize).fill(0).map((_, i) => (
          <Fragment key={i}>
            {new Array(boardSize).fill(0).map((_, j) => {
              const cell = board[toCellKey(i, j)];
              return (
                <TokenSpace
                  key={j}
                  className="w-full h-full bg-white rounded-sm flex items-stretch justify-stretch"
                  id={toCellKey(i, j)}
                  disabled={!!cell}
                  onDrop={(token) => {
                    if (cell) return;
                    const tileId = token.id;
                    gameSuite.prepareTurn((cur) => {
                      return {
                        placements: [
                          ...cur.placements.filter((p) => p.tileId !== tileId),
                          { tileId, cellKey: toCellKey(i, j) },
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
            })}
          </Fragment>
        ))}
      </div>
    );
  },
);
