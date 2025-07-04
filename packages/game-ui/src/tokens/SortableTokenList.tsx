import { Box, BoxProps, clsx } from '@a-type/ui';
import { AnimatePresence, motion } from 'motion/react';
import { Children, useId, useState } from 'react';
import { flipTransition } from '../dnd/transitions';
import { TokenSpace, TokenSpaceProps } from './TokenSpace';
import { TokenDragData } from './types';

export interface SortableTokenListProps<T> extends BoxProps {
  onMove: (token: TokenDragData<T>, index: number) => void;
}

export function SortableTokenList<T = any>({
  children: rawChildren,
  onMove,
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
  ...rest
}: {
  index: number;
  listId: string;
  last?: boolean;
} & Omit<TokenSpaceProps, 'id'>) {
  const [width, setWidth] = useState(32);
  return (
    <motion.div
      className={clsx(
        'relative w-0 self-stretch pointer-events-none',
        last && 'flex-1',
      )}
      animate={last ? undefined : { width }}
      transition={flipTransition}
    >
      <TokenSpace
        id={`${listId}-gap-[${index}]`}
        onOverAccepted={(token) => {
          if (token) setWidth(gapSize);
          else setWidth(0);
        }}
        className={clsx(
          'absolute left-1/2 center-x h-full',
          last ? 'w-full' : 'w-200%',
        )}
        style={{ minWidth: last ? 40 : gapSize }}
        {...rest}
      />
    </motion.div>
  );
}
