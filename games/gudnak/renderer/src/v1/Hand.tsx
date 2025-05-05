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
import { useClickAway } from '@uidotdev/usehooks';
import { isMobile } from 'react-device-detect';
import { useDndContext } from '@dnd-kit/core';

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
  const { active } = useDndContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandHand, setExpandHand] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => {
    setExpandHand(false);
  });
  const isMedium = useMediaQuery('(min-width: 768px)');
  const isLarge = useMediaQuery('(min-width: 1024px)');

  const cardSize = isLarge ? 200 : isMedium ? 180 : 120;

  const { width: availableWidth } = useScreenSize("[data-id='main-game-area']");
  if (!availableWidth) {
    return null;
  }
  const availableCardWidth = (cardSize * cards.length) / (availableWidth / 2);

  const cardWidth = cardSize; // Adjust based on your card width
  const overlapOffset =
    clamp(1 / availableCardWidth, 0.1, 0.7) * cardSize * 0.1;

  const totalWidth = (cards.length - 1) * overlapOffset + cardWidth;
  const centerOffset = (availableWidth - totalWidth) / 2;

  return (
    <Box
      className="relative flex flex-row py-2 z-50 w-full"
      style={{ height: cardSize }}
    >
      <motion.div
        className="w-full"
        ref={ref}
        initial={{
          y: isLarge ? 100 : isMedium ? 50 : 40,
          scale: 0.8,
        }}
        onTapStart={() => setExpandHand(true)}
        onTapCancel={() => setExpandHand(false)}
        animate={expandHand ? { y: 0, scale: 1 } : {}}
        whileHover={isMobile ? undefined : { y: 0, scale: 1, height: '200%' }}
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

            // adjust rotation before and after hovered card
            const rotationOffset = (() => {
              if (isHovered) {
                return 0;
              } else if (isBeforeHovered) {
                return -5;
              } else if (isAfterHovered) {
                return 5;
              } else {
                return 0;
              }
            })();

            return (
              <motion.div
                layout
                key={card.instanceId}
                className="absolute"
                style={{
                  transformOrigin: '50% 500%',
                  width: `${cardWidth}px`,
                  zIndex: isHovered ? 10 : index,
                }}
                animate={{
                  x: xOffset,
                  y: isHovered ? -20 : 0,
                  rotate:
                    active && active.id === card.instanceId
                      ? 0
                      : rotationOffset +
                        (30 / cards.length) * (index + 0.5 - cards.length / 2),
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: 'spring',
                  duration: 0.4,
                  bounce: 0.25,
                }}
                onTapStart={isMobile ? () => setHoveredIndex(index) : undefined}
                onTapCancel={isMobile ? () => setHoveredIndex(null) : undefined}
                onMouseEnter={
                  isMobile ? undefined : () => setHoveredIndex(index)
                }
                onMouseLeave={
                  isMobile ? undefined : () => setHoveredIndex(null)
                }
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
