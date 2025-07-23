import { Box, BoxProps, clsx } from '@a-type/ui';
import { AnimatePresence, motion } from 'motion/react';
import { Children, useId, useState } from 'react';
import { gesture } from '../dnd/gestureStore.js';
import { TokenSpace, TokenSpaceProps } from './TokenSpace.js';
import { TokenDragData } from './types.js';

export interface SortableTokenListProps<T> extends BoxProps {
  onMove: (token: TokenDragData<T>, index: number) => void;
  debug?: boolean;
  priority?: number; // for sorting purposes, higher means higher priority when bounds overlap
}

/**
 * Renders a list of Tokens which can be reordered by dragging.
 * It automatically inserts gaps between tokens to allow for dropping between
 * items. If your list doesn't take up the entire vertical space, consider
 * adding another TokenSpace below it to append new items.
 *
 * For Tokens rendered in SortableTokenList, the `movedBehavior` prop
 * should be set to 'fade' which produces the most stable animations on
 * drop. This gives the user context on where they are reordering the
 * item from, as well.
 */
export function SortableTokenList<T = any>({
  children: rawChildren,
  onMove,
  debug,
  priority: droppablePriority,
  ...rest
}: SortableTokenListProps<T>) {
  const listId = useId();
  const children = Children.toArray(rawChildren);
  const childrenWithInserts = children.flatMap((child, index) => [
    <SortableTokenListGap
      key={`${listId}-gap-${index}`}
      index={index}
      listId={listId}
      onDrop={(data) => onMove(data, Math.max(0, index))}
      debug={debug}
      priority={droppablePriority}
    />,
    child,
  ]);
  childrenWithInserts.push(
    <SortableTokenListGap
      key={`${listId}-gap-end`}
      index={children.length}
      listId={listId}
      onDrop={(data) => onMove(data, children.length)}
      last
      debug={debug}
      priority={droppablePriority}
    />,
  );

  return (
    <Box wrap items="start" justify="start" {...rest}>
      <AnimatePresence>{childrenWithInserts}</AnimatePresence>
    </Box>
  );
}

const gapSize = 80;
function SortableTokenListGap({
  index,
  listId,
  last,
  debug,
  ...rest
}: {
  index: number;
  listId: string;
  last?: boolean;
  debug?: boolean;
} & Omit<TokenSpaceProps, 'id'>) {
  const [width, setWidth] = useState(0);
  return (
    <motion.div
      className={clsx(
        'relative w-0 self-stretch pointer-events-none',
        last && 'flex-1',
      )}
      animate={last ? undefined : { width }}
      transition={
        width === 0 ? { duration: 0 } : { duration: 0.08, ease: 'easeInOut' }
      }
    >
      <TokenSpace
        id={`${listId}-gap-[${index}]`}
        onOverAccepted={(token) => {
          if (token) setWidth(gesture.initialBounds.width || gapSize);
          else setWidth(0);
        }}
        className={clsx(
          'absolute left-1/2 top-1/2 center h-120%',
          last ? 'w-full' : 'w-200%',
          debug && 'outline outline-attention',
        )}
        style={{ minWidth: last ? 40 : gapSize }}
        {...rest}
      />
    </motion.div>
  );
}
