import { Box, clsx } from '@a-type/ui';
import {
  type Coordinate,
  type Board,
  type PlayerState,
  type Card as CardType,
  type Target,
  cardDefinitions,
} from '@long-game/game-gudnak-definition/v1';
import { Space } from './Space';
import { Selection } from './useSelect';
import map from './images/map.png';
import mapVert from './images/map-vert.png';
import { useMediaQuery } from '@long-game/game-ui';
import { useDroppable } from '@dnd-kit/core';
import { hooks } from './gameClient';
import { RenderCard } from './Card';

function Map() {
  const isLarge = useMediaQuery('(min-width: 1024px)');
  const src = isLarge ? map : mapVert;

  return <img src={src} alt="Map" className="absolute w-full" />;
}

function DeckZone({ deck, side }: { deck: string[]; side: 'top' | 'bottom' }) {
  const isLarge = useMediaQuery('(min-width: 1024px)');

  if (deck.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'absolute aspect-[1/1] z-10',
        isLarge ? 'max-w[17%]' : 'max-w-[28%]',
        side === 'top'
          ? isLarge
            ? 'left-[1%] top-[37%] rotate-90'
            : 'left-[36%] top-[1%]'
          : isLarge
          ? 'right-[1%] top-[37%] -rotate-90'
          : 'left-[36%] bottom-[1%]',
      )}
    >
      <RenderCard
        instanceId={deck?.[0] ?? 'no-card'}
        cardData={{
          abilities: [],
          name: 'Deck',
          kind: 'fighter',
          faction: 'refractory',
          power: 0,
          traits: [],
        }}
        cardId="solaran-cavalry"
        faceDown
      />

      {deck.length && (
        <div
          className={clsx(
            isLarge
              ? side === 'top'
                ? '-rotate-90'
                : 'rotate-90'
              : 'rotate-0',
            'absolute w-full h-full text-4xl font-semibold',
            'top-0 left-0 flex items-center justify-center text-shadow-lg/30',
          )}
          style={{
            zIndex: 100,
            textShadow:
              '2px 2px 10px rgba(0, 0, 0, .8),-2px -2px 10px rgba(0, 0, 0, .8),2px -2px 10px rgba(0, 0, 0, .8),-2px 2px 10px rgba(0, 0, 0, .8)',
          }}
        >
          {deck.length}
        </div>
      )}
    </div>
  );
}

function DiscardZone({
  discard,
  side,
}: {
  discard: string[];
  side: 'top' | 'bottom';
}) {
  const isLarge = useMediaQuery('(min-width: 1024px)');
  const {
    finalState: { cardState },
  } = hooks.useGameSuite();
  const topCardInstanceId = discard[discard.length - 1];
  const topCard = cardState[topCardInstanceId];
  const topCardDef = topCard?.cardId
    ? cardDefinitions[topCard.cardId]
    : cardDefinitions['solaran-cavalry'];

  if (discard.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'absolute aspect-[1/1] z-10',
        isLarge ? 'max-w-[17%]' : 'max-w-[28%]',
        side === 'top'
          ? isLarge
            ? 'left-[1%] bottom-[7%] rotate-90'
            : 'left-[6%] top-[1%]'
          : isLarge
          ? 'right-[1%] top-[7%] -rotate-90'
          : 'right-[6%] bottom-[1%]',
      )}
    >
      <RenderCard
        instanceId={discard?.[0] ?? 'no-card'}
        cardData={topCardDef}
        cardId={topCard.cardId}
      />
    </div>
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
  const topPlayerState =
    Object.values(finalState.playerState).find((s) => s.side === 'top') ?? null;
  const bottomPlayerState =
    Object.values(finalState.playerState).find((s) => s.side === 'bottom') ??
    null;
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
      <DeckZone deck={topPlayerState?.deck ?? []} side="top" />
      <DeckZone deck={bottomPlayerState?.deck ?? []} side="bottom" />
      <DiscardZone discard={topPlayerState?.discard ?? []} side="top" />
      <DiscardZone discard={bottomPlayerState?.discard ?? []} side="bottom" />
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
