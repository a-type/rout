import { Box } from '@a-type/ui';
import { useDraggable } from '@dnd-kit/react';
import { AnimatePresence } from 'motion/react';
import { ReactNode, Ref, useState } from 'react';
import { CenterOnCursorModifier } from './CenterOnCursorModifier';
import { TokenHandDragSensor } from './TokenHandDragSensor';
import { TokenSpace } from './TokenSpace';
import { TokenDragData } from './types';

/**
 * A generic 'hand' of Token representations which the user can drag tokens
 * out of. The sizing of the tokens is dynamic to fit in the available space
 * without scrolling, but the representations in the hand must therefore be
 * capable of being quite small and still legible.
 *
 * When the user either swipes (touch) or hovers (mouse) over the hand, the
 * intersected token will show a large version above the cursor.
 *
 * When the user continues the gesture (either still touching, or clicking and holding
 * from hover), and moves upward past a threshold, the selected token will be lifted from the hand
 * and become a draggable, to be dropped elsewhere.
 */

export interface TokenHandProps<T> {
  values: TokenDragData<T>[];
  render: (value: TokenDragData<T>) => ReactNode;
  renderDetailed?: (value: TokenDragData<T>) => ReactNode;
  ref?: Ref<HTMLDivElement>;
  className?: string;
  onDrop?: (value: TokenDragData<T>) => void;
}

export function TokenHand<T = unknown>({
  values,
  render: renderCompact,
  renderDetailed = renderCompact,
  ref: userRef,
  className,
  onDrop,
}: TokenHandProps<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Box ref={userRef} d="row" full="width" className={className} asChild>
      <TokenSpace id="hand" onDrop={(v) => onDrop?.(v as TokenDragData<T>)}>
        <AnimatePresence>
          {values.map((value, index) => {
            return (
              <TokenHandItem
                id={value.id}
                key={value.id}
                value={value}
                index={index}
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
              >
                {renderCompact(value)}
              </TokenHandItem>
            );
          })}
        </AnimatePresence>
      </TokenSpace>
    </Box>
  );
}

function TokenHandItem({
  id,
  value,
  index,
  hoveredIndex,
  setHoveredIndex,
  children,
}: {
  id: string;
  value: any;
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  children: ReactNode;
}) {
  const isHovered = hoveredIndex === index;
  const { ref } = useDraggable({
    id,
    data: { id, type: 'token', data: value },
    sensors: [
      // this custom sensor only activates when the user pulls the token
      // upward out of the hand.
      TokenHandDragSensor.configure({}),
    ],
    modifiers: [CenterOnCursorModifier],
  });

  return (
    <Box
      key={value.id}
      className="relative flex-shrink-0 touch-none"
      onPointerEnter={() => setHoveredIndex(index)}
      onPointerLeave={() => setHoveredIndex(null)}
      ref={ref}
    >
      {children}
    </Box>
  );
}
