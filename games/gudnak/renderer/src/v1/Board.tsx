import { Box } from '@a-type/ui';
import type {
  Coordinate,
  Board,
  PlayerState,
  Card as CardType,
} from '@long-game/game-gudnak-definition/v1';
import { Space } from './Space';
import { useGameSuite } from '@long-game/game-client';

export function Board({
  state,
  selectedSpace,
  onClick,
  onClickCard,
}: {
  state: Board;
  selectedSpace: Coordinate | null;
  onClick?: (coord: Coordinate) => void;
  onClickCard?: (card: CardType) => void;
}) {
  const { finalState } = useGameSuite();
  const { specialSpaces } = finalState as PlayerState;
  return (
    <Box className="w-full h-full flex flex-col gap-2">
      {state.map((row, rowIndex) => (
        <Box key={rowIndex} className="flex flex-row gap-2">
          {row.map((space, columnIndex) => {
            const specialSpace = specialSpaces.find(
              (s) =>
                s.coordinate.x === columnIndex && s.coordinate.y === rowIndex,
            );
            const ownerId = specialSpace?.ownerId ?? null;
            const isGate = specialSpace?.type === 'gate';
            return (
              <Space
                key={columnIndex}
                stack={space}
                selected={
                  selectedSpace?.x === columnIndex &&
                  selectedSpace?.y === rowIndex
                }
                ownerId={ownerId}
                isGate={isGate}
                onClick={() => {
                  onClick?.({ x: columnIndex, y: rowIndex });
                }}
                onClickCard={onClickCard}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
