import {
  fromCellKey,
  getCenterCellKey,
  PathDetails,
  scorePath,
} from '@long-game/game-gridlock-definition/v1';
import { HelpSurface } from '@long-game/game-ui';
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
          <HelpSurface
            id={`path-score-${path.id}`}
            priority={1}
            key={path.id}
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
            content={
              path.isComplete
                ? `You scored ${score} points for this path!`
                : path.breaks.length > 0
                  ? `This path is broken, so it scores 0 points. Too bad!`
                  : `This path is not complete yet, but it can score ${score} points so far.`
            }
          >
            <span>{path.breaks.length > 0 ? 0 : score}</span>
          </HelpSurface>
        );
      })}
    </>
  );
}
