import { Box } from '@a-type/ui';
import { type CardStack } from '@long-game/game-gudnak-definition/v1';
import { Card } from './Card';
import { ValidCardId } from '../../../definition/src/v1/cardDefinition';

export function Space({
  stack,
  selected,
  onClick,
}: {
  stack: CardStack;
  selected?: boolean;
  onClick?: () => void;
}) {
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
      }}
    >
      {topCard ? <Card info={topCard} /> : null}
    </Box>
  );
}
