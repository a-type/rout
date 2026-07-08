import clsx from 'clsx';
import cls from './BrokenMarker.module.css';

export const BrokenMarker = ({
  direction,
  x,
  y,
  anchorNamespace = 'cell',
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  x: number;
  y: number;
  anchorNamespace?: string;
}) => {
  return (
    <div
      style={{
        positionAnchor: `--${anchorNamespace}-${x}-${y}`,
      }}
      className={cls.root}
    >
      <div
        className={clsx('@mode-attention', cls.marker)}
        data-direction={direction}
      >
        ×
      </div>
    </div>
  );
};
