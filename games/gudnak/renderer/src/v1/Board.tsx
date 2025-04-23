import { Box, clsx } from '@a-type/ui';
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
import map from './images/map.png';
import mapVert from './images/map-vert.png';
import { useMediaQuery } from '@long-game/game-ui';
import { useDroppable } from '@dnd-kit/core';

function Map() {
  const isLarge = useMediaQuery('(min-width: 1024px)');
  const src = isLarge ? map : mapVert;

  return <img src={src} alt="Map" className="absolute w-full" />;
}

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
  const { setNodeRef } = useDroppable({
    id: 'board',
    data: {
      coordinate: null,
    },
  });
  const { finalState } = useGameSuite();
  const { specialSpaces } = finalState as PlayerState;
  const isLarge = useMediaQuery('(min-width: 1024px)');

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'relative w-full select-none',
        isLarge ? 'aspect-[25/16]' : 'aspect-[16/25]',
      )}
    >
      <Map />
      <Box
        className={clsx(
          isLarge
            ? 'flex flex-col left-[22%] top-[7%] max-w-[calc(100vw-44%-500px)]'
            : 'flex flex-col left-[7%] top-[22%] max-w-[calc(100vw-14%)]',
        )}
      >
        {state.map((row, rowIndex) => (
          <Box
            key={rowIndex}
            className={clsx(
              isLarge
                ? 'flex flex-row mb-[3%] gap-[3%]'
                : 'flex flex-row mb-[3%] gap-[3%]',
            )}
          >
            {row.map((_, columnIndex) => {
              const x = isLarge ? rowIndex : columnIndex;
              const y = isLarge ? columnIndex : rowIndex;
              const space = isLarge
                ? state[columnIndex][rowIndex]
                : state[rowIndex][columnIndex];
              const specialSpace = specialSpaces.find(
                (s) => s.coordinate.x === x && s.coordinate.y === y,
              );
              const ownerId = specialSpace?.ownerId ?? null;
              const isGate = specialSpace?.type === 'gate';
              return (
                <Space
                  key={columnIndex}
                  stack={space}
                  coordinate={{ x, y }}
                  selection={selection}
                  targets={targets}
                  ownerId={ownerId}
                  isGate={isGate}
                  onClick={() => {
                    onClick?.({ x, y });
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
