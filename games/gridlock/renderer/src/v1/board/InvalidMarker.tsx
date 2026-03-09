import { Icon } from '@a-type/ui';
import { fromCellKey } from '@long-game/game-gridlock-definition/v1';
import { hooks } from '../gameClient.js';

export interface InvalidMarkerProps {
  anchorNamespace?: string;
}

export const InvalidMarker = hooks.withGame<InvalidMarkerProps>(
  function InvalidMarker({ gameSuite, anchorNamespace }) {
    const invalidCell = gameSuite.turnError?.data?.invalidCellKey;

    if (!invalidCell) return null;

    const { x, y } = fromCellKey(invalidCell);

    return (
      <div
        className="pointer-events-none fixed ring-attention ring-5 ring-inset z-10"
        style={{
          positionAnchor: `--${anchorNamespace}-${x}-${y}`,
          top: 'anchor(top)',
          left: 'anchor(left)',
          bottom: 'anchor(bottom)',
          right: 'anchor(right)',
        }}
      >
        <Icon name="warning" className="absolute top-sm left-sm color-main" />
      </div>
    );
  },
);
