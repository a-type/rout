import { Box } from '@a-type/ui';
import { Card } from './Card';
import type { Card as CardType } from '@long-game/game-gudnak-definition/v1';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useMediaQuery } from '@long-game/game-ui';
import { useScreenSize } from './utils';

export function Hand({
  cards,
  selectedId,
  onClickCard,
}: {
  cards: CardType[];
  selectedId: string | null;
  onClickCard: (card: CardType) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isLarge = useMediaQuery('(min-width: 1024px)');

  const cardSize = isLarge ? 200 : 120;

  const { width: availableWidth } = useScreenSize();
  if (!availableWidth) {
    return null;
  }
  const availableCardWidth = (cardSize * cards.length) / availableWidth;

  const cardWidth = cardSize; // Adjust based on your card width
  // TODO: Adjust based on screen size
  const overlapOffset =
    Math.max(0.1, Math.min(0.7, 1 / availableCardWidth / 2)) * cardSize;

  return (
    <Box
      className="relative flex flex-row py-2 z-50"
      style={{ height: cardSize }}
    >
      <AnimatePresence>
        {cards.map((card, index) => {
          const isHovered = hoveredIndex === index;
          const isBeforeHovered = hoveredIndex !== null && index < hoveredIndex;
          const isAfterHovered = hoveredIndex !== null && index > hoveredIndex;

          // Calculate dynamic position
          const xOffset = isHovered
            ? index * overlapOffset
            : isBeforeHovered
            ? index * overlapOffset
            : isAfterHovered
            ? index * overlapOffset + (cardWidth - overlapOffset)
            : index * overlapOffset;

          return (
            <motion.div
              layout
              key={card.instanceId}
              className="absolute"
              style={{
                width: `${cardWidth}px`,
                zIndex: isHovered ? 10 : index,
              }}
              animate={{ x: xOffset }}
              exit={{ opacity: 0 }}
              transition={{
                type: 'spring',
                duration: 0.4,
                bounce: 0.25,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Card
                selected={selectedId === card.instanceId}
                instanceId={card.instanceId}
                info={card}
                onClick={() => {
                  onClickCard(card);
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Box>
  );
}
