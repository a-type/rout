import { Box, clsx, withClassName } from '@a-type/ui';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import {
  Children,
  createContext,
  memo,
  ReactNode,
  Ref,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { getDraggableData, useDndStore } from '../dnd/dndStore';
import { useWindowEvent } from '../hooks/useWindowEvent';
import { TokenSpace } from './TokenSpace';
import { isToken, TokenDragData } from './types';

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
  children?: ReactNode;
  renderDetailed?: (value: TokenDragData<T>) => ReactNode;
  ref?: Ref<HTMLDivElement>;
  className?: string;
  onDrop?: (value: TokenDragData<T>) => void;
  /** Defaults to 'hand', use if you have multiple hands */
  id?: string;
}

export function TokenHand<T = unknown>({
  renderDetailed,
  ref: userRef,
  className,
  onDrop,
  id,
  children,
  ...rest
}: TokenHandProps<T>) {
  return (
    <TokenHandContext.Provider value={true}>
      <Box
        ref={userRef}
        d="row"
        full="width"
        className={clsx(className)}
        asChild
        {...rest}
      >
        <TokenSpace
          id={id || 'hand'}
          type="hand"
          onDrop={(v) => onDrop?.(v as TokenDragData<T>)}
          className="flex flex-row items-center justify-center gap-xs w-full overflow-hidden p-xs"
        >
          <AnimatePresence>
            {Children.map(children, (child) => (
              <HandItemWrapper>{child}</HandItemWrapper>
            ))}
          </AnimatePresence>
        </TokenSpace>
      </Box>
      <AnimatePresence>
        {renderDetailed && (
          <TokenHandPreview
            parentId={id || 'hand'}
            renderDetailed={renderDetailed}
          />
        )}
      </AnimatePresence>
    </TokenHandContext.Provider>
  );
}

const TokenHandPreview = memo(function TokenHandPreview({
  renderDetailed,
  parentId,
}: {
  renderDetailed: (value: TokenDragData<any>) => ReactNode;
  parentId: string;
}) {
  // we show a preview when we have a candidate but haven't started dragging yet
  const candidate = useDndStore((state) =>
    state.dragging
      ? null
      : state.candidate
        ? getDraggableData(state.candidate)
        : null,
  );
  const previewPosition = useFollowPointer({ x: 0, y: -80 });
  const transform = useMotionTemplate`translate3d(-50%, -100%, 0) translate3d(${previewPosition.x}px, ${previewPosition.y}px, 0)`;
  const overlayEl = useDndStore((state) => state.overlayElement);

  if (!candidate || !isToken(candidate)) {
    return null;
  }

  if (
    candidate.internal.space?.type !== 'hand' ||
    candidate.internal.space.id !== parentId
  ) {
    // don't show previews for tokens not in this hand
    return null;
  }

  return createPortal(
    <motion.div
      className="pointer-events-none select-none w-50vmin h-50vmin overflow-hidden flex items-center justify-center absolute z-10000"
      style={{ transform }}
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.5, duration: 0.2 }}
    >
      <div className="m-auto max-w-full max-h-full w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {renderDetailed(candidate as TokenDragData<any>)}
      </div>
    </motion.div>,
    overlayEl || document.body,
  );
});

// causes items to squeeze together if they overflow horizontally
const HandItemWrapper = withClassName(
  'div',
  'min-w-12px flex-shrink-1 flex-basis-auto',
  // we want the last child to not shrink so the end of the hand is not 'cut off'
  'last:(flex-shrink-0 min-w-auto)',
);

function useFollowPointer(offset: { x: number; y: number } = { x: 0, y: 0 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useWindowEvent('pointermove', ({ clientX, clientY }) => {
    // frame.read(() => {
    x.set(clientX + offset.x);
    y.set(clientY + offset.y);
    // });
  });

  return { x, y };
}

const TokenHandContext = createContext<boolean>(false);
export function useIsTokenInHand() {
  return useContext(TokenHandContext);
}
