import { clsx } from '@a-type/ui';
import { useDraggable } from '@dnd-kit/react';
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
  ref: userRef,
  style: userStyle,
  ...rest
}: TokenProps) {
  const { ref, isDragging } = useDraggable({
    id,
    data: makeToken(id, data),
    disabled,
  });

  const finalRef = useMergedRef<HTMLDivElement>(userRef, ref);

  return (
    <div
      {...rest}
      ref={finalRef}
      style={userStyle}
      className={clsx('[&[data-dragging=true]]:(z-10000)', className)}
      data-disabled={disabled}
      data-dragging={!!isDragging}
    >
      {children}
    </div>
  );
}
