import clsx from 'clsx';

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
        top: 'anchor(top)',
        left: 'anchor(left)',
        right: 'anchor(right)',
        bottom: 'anchor(bottom)',
      }}
      className="fixed pointer-events-none"
    >
      <div
        className={clsx(
          'absolute flex items-center justify-center color-white font-bold leading-none',
          'bg-attention w-[16px] h-[16px] rounded-full text-0.5em',
          direction === 'up' && 'top-0 left-1/2 -translate-x-1/2',
          direction === 'down' && 'bottom-0 left-1/2 -translate-x-1/2',
          direction === 'left' && 'left-0 top-1/2 -translate-y-1/2',
          direction === 'right' && 'right-0 top-1/2 -translate-y-1/2',
        )}
      >
        ×
      </div>
    </div>
  );
};
