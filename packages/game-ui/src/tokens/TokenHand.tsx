import { Box } from '@a-type/ui';
import { useDraggable } from '@dnd-kit/react';
import { frame, motion, useMotionTemplate, useSpring } from 'motion/react';
import { memo, ReactNode, Ref, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { proxy, useSnapshot } from 'valtio';
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

const hoverState = proxy({ index: -1 });

export function TokenHand<T = unknown>({
  values,
  render: renderCompact,
  renderDetailed,
  ref: userRef,
  className,
  onDrop,
}: TokenHandProps<T>) {
  return (
    <>
      <Box ref={userRef} d="row" full="width" className={className} asChild>
        <TokenSpace id="hand" onDrop={(v) => onDrop?.(v as TokenDragData<T>)}>
          {values.map((value, index) => {
            return (
              <TokenHandItem
                id={value.id}
                key={value.id}
                value={value}
                index={index}
              >
                {renderCompact(value)}
              </TokenHandItem>
            );
          })}
        </TokenSpace>
      </Box>
      {renderDetailed && (
        <TokenHandPreview values={values} renderDetailed={renderDetailed} />
      )}
    </>
  );
}

const TokenHandItem = memo(function TokenHandItem({
  id,
  value,
  index,
  children,
}: {
  id: string;
  value: any;
  index: number;
  children: ReactNode;
}) {
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
      onPointerEnter={() => {
        console.log('hovered', value.id);
        hoverState.index = index;
      }}
      onPointerLeave={() => {
        hoverState.index = -1;
      }}
      ref={ref}
    >
      {children}
    </Box>
  );
});

const TokenHandPreview = memo(function TokenHandPreview({
  values,
  renderDetailed,
}: {
  values: TokenDragData<any>[];
  renderDetailed: (value: TokenDragData<any>) => ReactNode;
}) {
  const index = useSnapshot(hoverState).index;
  const previewPosition = useFollowPointer({ x: 0, y: -30 });
  const transform = useMotionTemplate`translate3d(-50%, -100%, 0) translate3d(${previewPosition.x}px, ${previewPosition.y}px, 0)`;
  if (index < 0) return null;
  return createPortal(
    <motion.div
      className="pointer-events-none select-none w-max-content h-max-content max-w-30% max-h-40% absolute z-10000"
      style={{ transform }}
    >
      {renderDetailed(values[index])}
    </motion.div>,
    document.body,
  );
});

const spring = {
  bounce: 0.001,
  damping: 12,
  stiffness: 200,
  restDelta: 0.01,
  mass: 0.2,
};
function useFollowPointer(offset: { x: number; y: number } = { x: 0, y: 0 }) {
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  useEffect(() => {
    const handlePointerMove = ({ clientX, clientY }: MouseEvent) => {
      frame.read(() => {
        x.set(clientX + offset.x);
        y.set(clientY + offset.y);
      });
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return { x, y };
}
