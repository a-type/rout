import { Box, clsx } from '@a-type/ui';
import {
  type CardStack,
  type Card as CardType,
  Target,
  Coordinate,
  cardDefinitions,
} from '@long-game/game-gudnak-definition/v1';
import { Card } from './Card';
import { isCard, isCoordinate, Selection } from './useSelect';
import { useMediaQuery, usePlayerThemed } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { useDroppable } from '@dnd-kit/core';

export function Space({
  stack,
  coordinate,
  selection,
  targets,
  ownerId,
  isGate,
  onClick,
  onClickCard,
}: {
  stack: CardStack;
  coordinate: Coordinate;
  selection: Selection | null;
  targets: Target[];
  ownerId: string | null;
  isGate?: boolean;
  onClick?: () => void;
  onClickCard?: (card: CardType, coord: Coordinate) => void;
}) {
  const isLarge = useMediaQuery('(min-width: 1024px)');
  const { isOver, setNodeRef, active } = useDroppable({
    id: `space-${coordinate.x}-${coordinate.y}`,
    data: {
      coordinate,
    },
  });

  const draggedKind = active?.data.current?.cardInfo
    ? cardDefinitions[(active?.data.current?.cardInfo as CardType).cardId].kind
    : null;

  const selected =
    isCoordinate(selection) &&
    selection.x === coordinate.x &&
    selection.y === coordinate.y;

  const targeted = targets.some((t) => {
    if (t.kind === 'coordinate') {
      return t.x === coordinate.x && t.y === coordinate.y;
    }
  });

  const { finalState } = hooks.useGameSuite();
  const { className, style } = usePlayerThemed(ownerId as `u-${string}`);
  const { cardState } = finalState;
  const topCard = stack[stack.length - 1];
  const cardSelected = isCard(selection) && selection.instanceId === topCard;
  const cardTargeted = targets.some((t) => {
    if (t.kind === 'card') {
      return t.instanceId === topCard;
    }
  });
  return (
    <div className={clsx(className, 'w-full h-full')} style={style}>
      <Box
        className={clsx(
          'aspect-square border-3 rounded-2xl relative',
          ownerId ? 'border-primary' : 'border-gray-400',
          draggedKind === 'fighter' && isOver && 'bg-red-500/50',
          selected && 'bg-primary-light',
          targeted && 'bg-red-500/50',
        )}
        onClick={() => {
          onClick?.();
        }}
        p={isLarge ? 'lg' : 'md'}
        style={{
          borderStyle: isGate ? 'dashed' : 'solid',
        }}
      >
        <div
          data-id="drop-zone"
          ref={setNodeRef}
          className="absolute top-20% left-20% right-20% bottom-20%"
        ></div>
        {topCard ? (
          <Card
            stack={stack}
            selected={cardSelected}
            targeted={cardTargeted}
            info={cardState[topCard]}
            instanceId={cardState[topCard].instanceId}
            onClick={() => {
              onClickCard?.(cardState[topCard], coordinate);
            }}
          />
        ) : null}
      </Box>
    </div>
  );
}
