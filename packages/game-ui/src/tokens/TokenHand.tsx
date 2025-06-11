import { Box } from '@a-type/ui';
import { frame, motion, useMotionTemplate, useSpring } from 'motion/react';
import {
  createContext,
  memo,
  ReactNode,
  Ref,
  useContext,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { useDndStore } from './dnd/dndStore';
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
        className={className}
        asChild
        {...rest}
      >
        <TokenSpace
          id={id || 'hand'}
          type="hand"
          onDrop={(v) => onDrop?.(v as TokenDragData<T>)}
        >
          {children}
        </TokenSpace>
      </Box>
      {renderDetailed && (
        <TokenHandPreview
          parentId={id || 'hand'}
          renderDetailed={renderDetailed}
        />
      )}
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
      ? state.data[state.candidate]
      : null,
  );
  const previewPosition = useFollowPointer({ x: 0, y: -80 });
  const transform = useMotionTemplate`translate3d(-50%, -100%, 0) translate3d(${previewPosition.x}px, ${previewPosition.y}px, 0)`;

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
    >
      <div className="m-auto max-w-full max-h-full w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {renderDetailed(candidate as TokenDragData<any>)}
      </div>
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

const TokenHandContext = createContext<boolean>(false);
export function useIsTokenInHand() {
  return useContext(TokenHandContext);
}
