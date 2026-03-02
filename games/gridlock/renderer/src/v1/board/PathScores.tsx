import {
  fromCellKey,
  getCenterCellKey,
  PathDetails,
  scorePath,
} from '@long-game/game-gridlock-definition/v1';
import clsx from 'clsx';

export interface PathScoresProps {
  paths: PathDetails[];
  anchorNamespace?: string;
}

export function PathScores({
  paths,
  anchorNamespace = 'cell',
}: PathScoresProps) {
  return (
    <>
      {paths.map((path, index) => {
        const score = scorePath(path);
        const cellKey = getCenterCellKey(path.cells);
        const { x, y } = fromCellKey(cellKey);
        return (
          <div
            key={index}
            style={{
              positionAnchor: `--${anchorNamespace}-${x}-${y}`,
              top: 'anchor(center)',
              left: 'anchor(center)',
            }}
            className={clsx(
              'fixed -translate-x-1/2 -translate-y-1/2 text-0.5em pointer-events-none flex items-center justify-center p-xs rd-full leading-0 aspect-1',
              'color-contrast border-thin',
              {
                'font-bold bg-success': path.isComplete,
                'bg-main-wash border-main-dark border-dashed':
                  !path.isComplete && path.breaks.length === 0,
                'bg-gray': path.breaks.length > 0,
              },
            )}
          >
            <span>{score}</span>
          </div>
        );
      })}
    </>
  );
}
