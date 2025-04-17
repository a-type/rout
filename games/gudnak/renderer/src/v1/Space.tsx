import { Box } from '@a-type/ui';
import {
  type PlayerState,
  type CardStack,
} from '@long-game/game-gudnak-definition/v1';
import { Card } from './Card';
import { useGameSuite } from '@long-game/game-client';

export function Space({
  stack,
  selected,
  ownerId,
  isGate,
  onClick,
}: {
  stack: CardStack;
  selected?: boolean;
  ownerId: string | null;
  isGate?: boolean;
  onClick?: () => void;
}) {
  const { players, finalState } = useGameSuite();
  const { cardState } = finalState as PlayerState;
  const borderColor = ownerId ? (players as any)[ownerId]?.color : 'gray';
  const topCard = stack[stack.length - 1];
  return (
    <Box
      onClick={onClick}
      className="w-full h-full"
      border
      p="md"
      style={{
        minWidth: '100px',
        minHeight: '100px',
        background: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        borderColor,
        borderStyle: isGate ? 'dashed' : 'solid',
      }}
    >
      {topCard ? <Card info={cardState[topCard]} /> : null}
    </Box>
  );
}
