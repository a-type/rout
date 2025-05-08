import { Box } from '@a-type/ui';
import { Card } from '../card/Card';
import type {
  Card as CardType,
  Target,
} from '@long-game/game-gudnak-definition/v1';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useMediaQuery } from '@long-game/game-ui';
import { rotatePointAroundAnotherPoint, useScreenSize } from '../utils/utils';
import { useClickAway } from '@uidotdev/usehooks';
import { isMobile } from 'react-device-detect';
import { useDroppable } from '@dnd-kit/core';

export function Hand({
  cards,
  selectedId,
  targets,
  onClickCard,
}: {
  cards: CardType[];
  targets: Target[];
  selectedId: string | null;
  onClickCard?: (card: CardType) => void;
}) {
  const { setNodeRef, active } = useDroppable({
    id: 'hand',
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandHand, setExpandHand] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => {
    setExpandHand(false);
  });
  const isMedium = useMediaQuery('(min-width: 768px)');
  const isLarge = useMediaQuery('(min-width: 1024px)');

  const maxRotation = isLarge ? 30 : isMedium ? 25 : 20;

  const cardSize = isLarge ? 200 : isMedium ? 200 : 120;

  const { width: availableWidth } = useScreenSize("[data-id='main-game-area']");
  if (!availableWidth) {
    return null;
  }

  const cardWidth = cardSize; // Adjust based on your card width
  const overlapOffset = cardSize * 0.05;

  const totalWidth = (cards.length - 1) * overlapOffset + cardWidth;
  const centerOffset = (availableWidth - totalWidth) / 2;

  return (
    <Box
      ref={setNodeRef}
      className="relative flex flex-row w-full"
      style={{ height: cardSize * 0.5 }}
    >
      <motion.div
        className="w-full z-50"
        ref={ref}
        initial={{
          y: 0,
          scale: 0.8,
        }}
        onTapStart={() => setExpandHand(true)}
        onTapCancel={() => setExpandHand(false)}
        animate={expandHand ? { y: -25, scale: 1 } : {}}
        whileHover={
          isMobile
            ? undefined
            : {
                y: isLarge ? -100 : isMedium ? -75 : -50,
                scale: 1,
                height: '300%',
              }
        }
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
            const isBeingDragged = active && active.id === card.instanceId;

            const xOffset = (() => {
              if (isHovered || isBeingDragged) {
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

            // each card takes up a fratction of the total rotation, with limits when you don't have many cards
            // so it doesn't look too weird
            const rotationFactor = Math.min(10, maxRotation / cards.length);
            const rotation =
              rotationOffset +
              rotationFactor * (index + 0.5 - cards.length / 2);

            // using manual rotation to avoid transform origin issues with dndkit
            const { x, y } = rotatePointAroundAnotherPoint(
              { x: 0, y: 0 },
              { x: 0, y: cardSize * 4 },
              rotation,
            );

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
                  x: x + xOffset,
                  y: y + (isHovered ? -20 : 0),
                  rotate: isBeingDragged ? 0 : rotation,
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
                    onClickCard?.(card);
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
