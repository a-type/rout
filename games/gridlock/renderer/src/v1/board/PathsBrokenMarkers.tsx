import {
  fromCellKey,
  PathDetails,
} from '@long-game/game-gridlock-definition/v1';
import { BrokenMarker } from './BrokenMarker.js';

export interface PathsBrokenMarkersProps {
  paths: PathDetails[];
  anchorNamespace?: string;
}

export function PathsBrokenMarkers({
  paths,
  anchorNamespace,
}: PathsBrokenMarkersProps) {
  return (
    <>
      {paths.map((path) => {
        if (!path.brokenAt || !path.brokenAtDirection) return null;
        const { x, y } = fromCellKey(path.brokenAt);
        return (
          <BrokenMarker
            key={path.brokenAt}
            x={x}
            y={y}
            direction={path.brokenAtDirection}
            anchorNamespace={anchorNamespace}
          />
        );
      })}
    </>
  );
}
