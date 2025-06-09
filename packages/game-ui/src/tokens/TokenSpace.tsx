import { clsx } from '@a-type/ui';
import { Droppable, DroppableProps } from './dnd/Droppable';
import { TokenDragData } from './types';

export interface TokenSpaceProps extends Omit<DroppableProps, 'onDrop'> {
  onDrop?: (token: TokenDragData) => void;
  className?: string;
}

export function TokenSpace({
  id,
  children,
  className,
  onDrop,
  ...rest
}: TokenSpaceProps) {
  return (
    <Droppable<TokenDragData>
      id={id}
      className={clsx(
        'relative',
        '[&[data-over=true]]:(ring-primary ring-2 ring-solid)',
        className,
      )}
      onDrop={(droppable) => onDrop?.(droppable.data)}
      {...rest}
    >
      {children}
    </Droppable>
  );
}
