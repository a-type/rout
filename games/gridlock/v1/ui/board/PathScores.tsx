import { HelpSurface } from '@long-game/game-ui';
import clsx from 'clsx';
import {
  fromCellKey,
  getCenterCellKey,
  PathDetails,
  scorePath,
} from '../../definition/index';
import cls from './PathScores.module.css';

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
            }}
            data-complete={path.isComplete}
            data-broken={path.breaks.length > 0}
            className={clsx(
              {
                '@mode-success': path.isComplete,
                '@mode-neutral': !path.isComplete && path.breaks.length > 0,
              },
              cls.root,
            )}
            content={
              path.isComplete
                ? `You scored ${score} points for this path!`
                : path.breaks.length > 0
                  ? `This path is broken, so it scores 0 points. Too bad!`
                  : `This path is not complete yet, but it can score ${score} points so far.`
            }
            title="Path Score"
          >
            <span>{path.breaks.length > 0 ? 0 : score}</span>
          </HelpSurface>
        );
      })}
    </>
  );
}
