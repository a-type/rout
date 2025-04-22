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
import mapVert from './images/map-vert.png';

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
  onClickCard?: (card: CardType, coord: Coordinate) => void;
}) {
  const { finalState } = useGameSuite();
  const { specialSpaces } = finalState as PlayerState;
  return (
    <div className="relative w-full aspect-[16/25]">
      <img src={mapVert} alt="Map" className="absolute w-full" />
      <Box className="flex flex-col left-[7%] top-[22%] max-w-[calc(100vw-14%)] lg:max-w-[calc(100vw-14%-500px)]">
        {state.map((row, rowIndex) => (
          <Box key={rowIndex} className="flex flex-row mb-[3%] gap-[3%]">
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
    </div>
  );
}
