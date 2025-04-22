import { Box, clsx } from '@a-type/ui';
import {
  type PlayerState,
  type CardStack,
  type Card as CardType,
  Target,
  Coordinate,
} from '@long-game/game-gudnak-definition/v1';
import { Card, CARD_SIZE } from './Card';
import { isCard, isCoordinate, Selection } from './useSelect';
import { usePlayerThemed } from '@long-game/game-ui';
import { hooks } from './gameClient';

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
          'aspect-square',
          ownerId ? 'border-primary' : 'border-gray-400',
          selected && 'bg-primary-light opacity-50',
          targeted && 'bg-primary-wash opacity-50',
        )}
        onClick={() => {
          onClick?.();
        }}
        border
        p="md"
        style={{
          borderStyle: isGate ? 'dashed' : 'solid',
        }}
      >
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
