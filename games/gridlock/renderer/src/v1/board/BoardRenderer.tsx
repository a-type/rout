import { PrefixedId } from '@long-game/common';
import {
  boardSize,
  getDistinctPaths,
  pathsToLookup,
  PlayerBoard,
  toCellKey,
} from '@long-game/game-gridlock-definition/v1';
import { usePlayerThemed } from '@long-game/game-ui';
import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';
import { useSnapshot } from 'valtio';
import { hooks } from '../gameClient.js';
import { rendererState } from '../state.js';
import { BoardGrid } from './BoardGrid.js';
import { LiveBoardCell } from './LiveBoardCell.js';
import { PathAnnotations } from './PathAnnotations.js';
import { ReadonlyBoardCell } from './ReadonlyBoardCell.js';

export interface BoardRendererProps {
  board: PlayerBoard;
  className?: string;
  readonly?: boolean;
  playerId: PrefixedId<'u'>;
}

export const BoardRenderer = hooks.withGame<BoardRendererProps>(
  function BoardRenderer({ board, className, readonly, playerId }) {
    const paths = getDistinctPaths(board);
    const pathLookup = pathsToLookup(paths);
    const focusedPathId = useSnapshot(rendererState).focusPathId;
    const playerStyles = usePlayerThemed(playerId);

    return (
      <BoardGrid
        className={clsx(className, playerStyles.className)}
        style={playerStyles.style}
      >
        {new Array(boardSize).fill(0).map((_, y) => (
          <Fragment key={y}>
            {new Array(boardSize).fill(0).map((_, x) => {
              const key = toCellKey(x, y);
              const cell = board[key];
              const path = pathLookup[key];

              const focused = focusedPathId === path?.id;

              if (readonly) {
                return (
                  <ReadonlyBoardCell
                    key={key}
                    cellKey={key}
                    cell={cell}
                    playerId={playerId}
                    pathIsBroken={path?.breaks.length > 0}
                    pathIsComplete={path?.isComplete}
                    className={focused ? 'bg-accent-wash' : undefined}
                  />
                );
              }
              return (
                <LiveBoardCell
                  key={key}
                  cell={cell}
                  cellKey={key}
                  pathIsBroken={path?.breaks.length > 0}
                  pathIsComplete={path?.isComplete}
                  playerId={playerId}
                  className={focused ? 'bg-accent-wash' : undefined}
                />
              );
            })}
          </Fragment>
        ))}
        <PathAnnotations paths={paths} anchorNamespace={playerId} />
      </BoardGrid>
    );
  },
);
