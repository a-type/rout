import { clsx } from '@a-type/ui';
import { Coordinate } from '@long-game/game-gudnak-definition/v1';
import { useHighlightSpace } from '../useHighlightSpace';

export function ChatCoordinate({
  coordinate,
  className,
}: {
  coordinate: Coordinate;
  className?: string;
}) {
  const { setHighlightedCoordinate, clearHighlightedCoordinate } =
    useHighlightSpace();
  const { x, y } = coordinate;
  const valid = x >= 0 && y >= 0;
  const coordinateString = valid ? `(${x},${y})` : 'invalid';
  return (
    <span
      className={clsx(
        'text-yellow-500 cursor-pointer',
        'font-mono',
        'flex items-center',
        className,
      )}
      onMouseEnter={() => {
        setHighlightedCoordinate(coordinate);
      }}
      onMouseLeave={() => {
        clearHighlightedCoordinate();
      }}
    >
      {coordinateString}
    </span>
  );
}
