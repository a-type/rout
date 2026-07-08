import { clsx, Icon } from '@a-type/ui';
import { fromCellKey } from '../../definition/index';
import { hooks } from '../gameClient.js';
import cls from './InvalidMarker.module.css';

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
        className={clsx(cls.root, '@mode-attention')}
        style={{
          positionAnchor: `--${anchorNamespace}-${x}-${y}`,
        }}
      >
        <Icon name="warning" className={cls.marker} />
      </div>
    );
  },
);
