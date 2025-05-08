import { Box, clsx } from '@a-type/ui';
import { useDroppable } from '@dnd-kit/core';
import {
  type Board,
  type Card as CardType,
  type Coordinate,
  type PlayerState,
  type Target,
} from '@long-game/game-gudnak-definition/v1';
import { DeckZone } from './DeckZone';
import { DiscardZone } from './DiscardZone';
import { useBoardOrientation } from '../utils/useBoardOrientation';
import { hooks } from '../gameClient';
import mapVert from '../images/map-vert.png';
import map from '../images/map.png';
import { Space } from './Space';
import { Selection } from '../gameAction/useSelect';

function Map() {
  const orientation = useBoardOrientation();
  const src = orientation === 'landscape' ? map : mapVert;

  return (
    <img
      draggable="false"
      src={src}
      alt="Map"
      className="absolute w-full select-none
  "
    />
  );
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
  const { finalState } = hooks.useGameSuite();
  const [topPlayerId = '', topPlayerState] =
    Object.entries(finalState.playerState).find(([, s]) => s.side === 'top') ??
    [];
  const [bottomPlayerId = '', bottomPlayerState] =
    Object.entries(finalState.playerState).find(
      ([, s]) => s.side === 'bottom',
    ) ?? [];
  const { specialSpaces } = finalState as PlayerState;
  const orientation = useBoardOrientation();

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'relative w-full select-none',
        orientation === 'landscape' ? 'aspect-[25/16]' : 'aspect-[16/25]',
      )}
    >
      <Map />
      <DeckZone deck={topPlayerState?.deck ?? []} side="top" />
      <DeckZone deck={bottomPlayerState?.deck ?? []} side="bottom" />
      <DiscardZone
        playerId={topPlayerId}
        discard={topPlayerState?.discard ?? []}
        side="top"
      />
      <DiscardZone
        playerId={bottomPlayerId}
        discard={bottomPlayerState?.discard ?? []}
        side="bottom"
      />
      <Box
        className={clsx(
          // orientation === 'landscape'
          //   ? 'flex flex-col left-[22%] top-[7%] max-w-[calc(100vw-44%-500px)]'
          //   : 'flex flex-col left-[7%] top-[22%] max-w-[calc(100vw-14%)]',
          orientation === 'landscape'
            ? 'flex flex-col aspect-1 h-90% left-1/2 top-1/2 -translate-1/2'
            : 'flex flex-col aspect-1 w-90% left-1/2 top-1/2 -translate-1/2',
        )}
      >
        {state.map((row, rowIndex) => (
          <Box
            key={rowIndex}
            className={clsx(
              orientation === 'landscape'
                ? 'flex flex-row mb-[3%] gap-[3%]'
                : 'flex flex-row mb-[3%] gap-[3%]',
            )}
          >
            {row.map((_, columnIndex) => {
              const x = orientation === 'landscape' ? rowIndex : columnIndex;
              const y = orientation === 'landscape' ? columnIndex : rowIndex;
              const space =
                orientation === 'landscape'
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
