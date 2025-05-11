import { Box, clsx, useSize } from '@a-type/ui';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'motion/react';
import { Children, ReactNode, Ref, useRef, useState } from 'react';
import { useClickAway } from '../hooks/useClickAway';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useMergedRef } from '../hooks/useMergedRef';

export interface TokenHandProps {
  children: ReactNode;
  childIds: string[];
  ref?: Ref<HTMLDivElement>;
  className?: string;
}

export function TokenHand({
  children: rawChildren,
  ref: userRef,
  childIds,
  className,
}: TokenHandProps) {
  const children = Children.toArray(rawChildren);
  const { setNodeRef, active } = useDroppable({
    id: 'hand',
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandHand, setExpandHand] = useState(false);
  const handRef = useRef<HTMLDivElement>(null);
  useClickAway(() => {
    setExpandHand(false);
  }, handRef);

  const isMedium = useMediaQuery('(min-width: 768px)');
  const isLarge = useMediaQuery('(min-width: 1024px)');

  const maxRotation = isLarge ? 30 : isMedium ? 25 : 20;

  const [availableWidth, setAvailableWidth] = useState(0);
  const sizeRef = useSize<HTMLDivElement>(({ width }) =>
    setAvailableWidth(width),
  );
  const tokenSize = isLarge ? 200 : isMedium ? 200 : 120;
  const overlapOffset = tokenSize * 0.05;

  const totalWidth = (children.length - 1) * overlapOffset + tokenSize;
  const centerOffset = (availableWidth - totalWidth) / 2;

  const finalRef = useMergedRef<HTMLDivElement>(setNodeRef, sizeRef, userRef);

  return (
    <Box
      ref={finalRef}
      className={clsx('relative flex flex-row w-full', className)}
      style={{ height: tokenSize * 0.5 }}
    >
      <motion.div
        className="w-full z-50"
        ref={handRef}
        initial={{
          y: 0,
          scale: 0.8,
        }}
        onTapStart={() => setExpandHand(true)}
        onTapCancel={() => setExpandHand(false)}
        animate={expandHand ? { y: -25, scale: 1 } : {}}
        whileHover={
          isLarge || isMedium
            ? {
                y: isLarge ? -100 : isMedium ? -75 : -50,
                scale: 1,
                height: '300%',
              }
            : undefined
        }
        transition={{
          type: 'spring',
          duration: 0.4,
          bounce: 0.25,
        }}
      >
        <AnimatePresence>
          {children.map((child, index) => {
            const isHovered = hoveredIndex === index;
            const isBeforeHovered =
              hoveredIndex !== null && index < hoveredIndex;
            const isAfterHovered =
              hoveredIndex !== null && index > hoveredIndex;
            const isBeingDragged = active && active.id === childIds[index];

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
            const rotationFactor = Math.min(10, maxRotation / children.length);
            const rotation =
              rotationOffset +
              rotationFactor * (index + 0.5 - children.length / 2);

            // using manual rotation to avoid transform origin issues with dndkit
            const { x, y } = rotatePointAroundAnotherPoint(
              { x: 0, y: 0 },
              { x: 0, y: tokenSize * 4 },
              rotation,
            );

            return (
              <motion.div
                layout
                key={childIds[index]}
                className="absolute"
                style={{
                  width: `${tokenSize}px`,
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
                onTouchStart={() => setHoveredIndex(index)}
                onTouchCancel={() => setHoveredIndex(null)}
                onPointerEnter={(ev) => {
                  if (ev.pointerType === 'mouse') {
                    setHoveredIndex(index);
                  }
                }}
                onPointerLeave={(ev) => {
                  if (ev.pointerType === 'mouse') {
                    setHoveredIndex(null);
                  }
                }}
              >
                {child}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Box>
  );
}

export function rotatePointAroundAnotherPoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number,
) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;

  return {
    x: translatedX * cos - translatedY * sin + center.x,
    y: translatedX * sin + translatedY * cos + center.y,
  };
}
