import { Box, withClassName } from '@a-type/ui';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'motion/react';
import {
  Children,
  createContext,
  CSSProperties,
  memo,
  ReactNode,
  Ref,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { draggableDataRegistry } from '../dnd/dataRegistry.js';
import { useDndStore } from '../dnd/dndStore.js';
import { gesture } from '../dnd/index.js';
import { useWindowEvent } from '../hooks/useWindowEvent.js';
import cls from './TokenHand.module.css';
import { TokenSpace } from './TokenSpace.js';
import { isToken, TokenDragData } from './types.js';

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
  style?: CSSProperties;
  onDrop?: (value: TokenDragData<T>) => void;
  /** Defaults to 'hand', use if you have multiple hands */
  id?: string;
  priority?: number; // for sorting purposes, higher means higher priority when bounds overlap
}

export function TokenHand<T = unknown>({
  renderDetailed,
  ref: userRef,
  className,
  onDrop,
  id,
  children,
  priority,
  style,
  ...rest
}: TokenHandProps<T>) {
  return (
    <TokenHandContext.Provider value={true}>
      <Box ref={userRef} full="width" className={className} style={style}>
        <TokenSpace
          id={id || 'hand'}
          type="hand"
          onDrop={(v) => onDrop?.(v as TokenDragData<T>)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--m-space-xs)',
            overflow: 'clip',
            width: '100%',
            padding: 'var(--m-space-xs)',
          }}
          priority={priority}
          {...rest}
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
  const hasCandidate = useDndStore((state) => !!state.candidate);
  const candidate = useDndStore((state) =>
    state.dragging
      ? null
      : state.candidate
        ? draggableDataRegistry.get(state.candidate)
        : null,
  );
  const previewPosition = useFollowPointer({ x: 0, y: -80 });
  const transform = useMotionTemplate`translate3d(-50%, -100%, 0) translate3d(${previewPosition.x}px, ${previewPosition.y}px, 0)`;
  const overlayEl = useDndStore((state) => state.domOverlayElement);

  if (!candidate || !isToken(candidate)) {
    return null;
  }

  if (gesture.draggedFrom !== parentId) {
    // don't show previews for tokens not in this hand
    return null;
  }

  return createPortal(
    <motion.div
      style={{
        transform,
        pointerEvents: 'none',
        userSelect: 'none',
        width: '50vmin',
        height: '50vmin',
        overflow: 'clip',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        zIndex: 10000,
      }}
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.5, duration: 0.2 }}
    >
      <div
        style={{
          margin: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'clip',
        }}
      >
        {renderDetailed(candidate as TokenDragData<any>)}
      </div>
    </motion.div>,
    overlayEl || document.body,
  );
});

// causes items to squeeze together if they overflow horizontally
const HandItemWrapper = withClassName('div', cls.itemWrapper);

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
