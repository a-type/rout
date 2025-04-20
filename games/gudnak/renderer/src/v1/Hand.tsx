import { Box } from '@a-type/ui';
import { Card } from './Card';
import type { Card as CardType } from '@long-game/game-gudnak-definition/v1';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

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

  const cardWidth = 200; // Adjust based on your card width
  const overlapOffset = 150; // Amount of overlap between cards

  return (
    <Box className="relative flex flex-row py-2" style={{ height: '200px' }}>
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
