import { Box, BoxProps, clsx } from '@a-type/ui';
import { motion, useSpring } from 'motion/react';
import { Children, useId } from 'react';
import { TokenSpace, TokenSpaceProps } from './TokenSpace';
import { TokenDragData } from './types';

export interface SortableTokenListProps extends BoxProps {
  onMove: (token: TokenDragData, index: number) => void;
}

export function SortableTokenList({
  children: rawChildren,
  onMove,
  ...rest
}: SortableTokenListProps) {
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
    <Box wrap {...rest}>
      {childrenWithInserts}
    </Box>
  );
}

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
  const width = useSpring(32, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.1,
  });
  return (
    <TokenSpace
      id={`${listId}-gap-[${index}]`}
      onOverAccepted={(token) => {
        width.set(token ? 120 : 32);
      }}
      className={clsx('bg-primary-wash', last && 'flex-1')}
      {...rest}
    >
      <motion.div style={{ width }} />
    </TokenSpace>
  );
}
