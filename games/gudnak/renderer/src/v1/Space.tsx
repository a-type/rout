import { Box } from '@a-type/ui';
import {
  type PlayerState,
  type CardStack,
  type Card as CardType,
  Target,
  Coordinate,
} from '@long-game/game-gudnak-definition/v1';
import { Card } from './Card';
import { useGameSuite } from '@long-game/game-client';
import { isCard, isCoordinate, Selection } from './useSelect';

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
  onClickCard?: (card: CardType) => void;
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
  const { players, finalState } = useGameSuite();
  const { cardState } = finalState as PlayerState;
  const borderColor = ownerId ? (players as any)[ownerId]?.color : 'gray';
  const topCard = stack[stack.length - 1];
  const cardSelected = isCard(selection) && selection.instanceId === topCard;
  const cardTargeted = targets.some((t) => {
    if (t.kind === 'card') {
      return t.instanceId === topCard;
    }
  });
  return (
    <Box
      onClick={() => {
        onClick?.();
      }}
      className="w-full h-full"
      border
      p="md"
      style={{
        minWidth: '100px',
        minHeight: '100px',
        background: selected
          ? 'rgba(255, 255, 255, 0.2)'
          : targeted
          ? 'rgba(255, 240, 79, 0.2)'
          : 'transparent',
        borderColor,
        borderStyle: isGate ? 'dashed' : 'solid',
      }}
    >
      {topCard ? (
        <Card
          stack={stack}
          selected={cardSelected}
          targeted={cardTargeted}
          info={cardState[topCard]}
          onClick={() => {
            onClickCard?.(cardState[topCard]);
          }}
        />
      ) : null}
    </Box>
  );
}
