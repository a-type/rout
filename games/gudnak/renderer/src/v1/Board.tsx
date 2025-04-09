import { Box } from '@a-type/ui';
import type { Coordinate, Board } from '@long-game/game-gudnak-definition/v1';
import { Space } from './Space';

export function Board({
  state,
  selectedSpace,
  onClick,
}: {
  state: Board;
  selectedSpace: Coordinate | null;
  onClick?: (coord: Coordinate) => void;
}) {
  return (
    <Box className="w-full h-full flex flex-col gap-2">
      {state.map((row, rowIndex) => (
        <Box key={rowIndex} className="flex flex-row gap-2">
          {row.map((space, columnIndex) => (
            <Space
              key={columnIndex}
              stack={space}
              selected={
                selectedSpace?.x === columnIndex &&
                selectedSpace?.y === rowIndex
              }
              onClick={() => {
                onClick?.({ x: columnIndex, y: rowIndex });
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
