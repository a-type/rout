import {
  fromCellKey,
  PathDetails,
} from '@long-game/game-gridlock-definition/v1';
import { BrokenMarker } from './BrokenMarker.js';
import { PathScores } from './PathScores.js';

export interface PathsBrokenMarkersProps {
  paths: PathDetails[];
  anchorNamespace?: string;
}

export function PathAnnotations({
  paths,
  anchorNamespace,
}: PathsBrokenMarkersProps) {
  return (
    <>
      {paths.flatMap((path) => {
        if (!path.breaks.length) return null;
        return path.breaks.map((breakItem) => {
          const { x, y } = fromCellKey(breakItem.cellKey);
          return (
            <BrokenMarker
              key={breakItem.cellKey + breakItem.direction}
              x={x}
              y={y}
              direction={breakItem.direction}
              anchorNamespace={anchorNamespace}
            />
          );
        });
      })}
      <PathScores paths={paths} anchorNamespace={anchorNamespace} />
    </>
  );
}
