import { Box } from '@a-type/ui';
import { Card } from './Card';
import type {
  Card as CardType,
  Target,
} from '@long-game/game-gudnak-definition/v1';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useMediaQuery } from '@long-game/game-ui';
import { clamp, useScreenSize } from './utils';

export function Hand({
  cards,
  selectedId,
  targets,
  onClickCard,
}: {
  cards: CardType[];
  targets: Target[];
  selectedId: string | null;
  onClickCard: (card: CardType) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isMedium = useMediaQuery('(min-width: 768px)');
  const isLarge = useMediaQuery('(min-width: 1024px)');

  const cardSize = isLarge ? 200 : isMedium ? 180 : 120;

  const { width: availableWidth } = useScreenSize("[data-id='main-game-area']");
  if (!availableWidth) {
    return null;
  }
  const availableCardWidth = (cardSize * cards.length) / (availableWidth / 1.5);

  const cardWidth = cardSize; // Adjust based on your card width
  const overlapOffset = clamp(1 / availableCardWidth, 0.1, 0.7) * cardSize;

  const totalWidth = (cards.length - 1) * overlapOffset + cardWidth;
  const centerOffset = (availableWidth - totalWidth) / 2;

  return (
    <Box
      className="relative flex flex-row py-2 z-50 w-full"
      style={{ height: cardSize }}
    >
      <motion.div
        initial={{ y: isLarge ? 50 : isMedium ? 50 : 40, scale: 0.8 }}
        whileHover={{ y: 0, scale: 1 }}
        transition={{
          type: 'spring',
          duration: 0.4,
          bounce: 0.25,
        }}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const isHovered = hoveredIndex === index;
            const isBeforeHovered =
              hoveredIndex !== null && index < hoveredIndex;
            const isAfterHovered =
              hoveredIndex !== null && index > hoveredIndex;

            const xOffset = (() => {
              if (isHovered) {
                return index * overlapOffset + centerOffset;
              } else if (isBeforeHovered) {
                return index * overlapOffset + centerOffset - overlapOffset / 2;
              } else if (isAfterHovered) {
                return index * overlapOffset + centerOffset + overlapOffset / 2;
              } else {
                return index * overlapOffset + centerOffset;
              }
            })();

            return (
              <motion.div
                layout
                key={card.instanceId}
                className="absolute"
                style={{
                  width: `${cardWidth}px`,
                  zIndex: isHovered ? 10 : index,
                }}
                animate={{
                  x: xOffset,
                  y: isHovered
                    ? -10
                    : Math.abs(index + 0.5 - cards.length / 2) * 5,
                  rotate: 2 * (index + 0.5 - cards.length / 2),
                }}
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
                  targeted={targets.some(
                    (t) =>
                      t.kind === 'card' && t.instanceId === card.instanceId,
                  )}
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
      </motion.div>
    </Box>
  );
}
