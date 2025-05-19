import { clsx } from '@a-type/ui';
import { useDraggable } from '@dnd-kit/core';
import { CSSProperties, ReactNode, Ref } from 'react';
import { useMergedRef } from '../hooks/useMergedRef';
import { makeToken } from './types';

export interface TokenProps<Data = unknown> {
  children?: ReactNode;
  id: string;
  data?: Data;
  className?: string;
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
}

export function Token({
  children,
  id,
  data,
  className,
  disabled,
  ref,
  style: userStyle,
  ...rest
}: TokenProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: makeToken(id, data),
      disabled,
    });

  const style = transform
    ? {
        ...userStyle,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : userStyle;

  const finalRef = useMergedRef<HTMLDivElement>(ref, setNodeRef);

  return (
    <div
      {...rest}
      ref={finalRef}
      style={style}
      className={clsx('[&[data-dragging=true]]:(z-10000)', className)}
      data-disabled={disabled}
      data-dragging={!!isDragging}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
