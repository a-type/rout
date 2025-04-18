import { Box } from '@a-type/ui';
import type {
  Coordinate,
  Board,
  PlayerState,
  Card as CardType,
  Target,
} from '@long-game/game-gudnak-definition/v1';
import { Space } from './Space';
import { useGameSuite } from '@long-game/game-client';
import { Selection } from './useSelect';

export function Board({
  state,
  selection,
  targets,
  onClick,
  onClickCard,
}: {
  state: Board;
  selection: Selection;
  targets: Target[];
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
                coordinate={{ x: columnIndex, y: rowIndex }}
                selection={selection}
                targets={targets}
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
