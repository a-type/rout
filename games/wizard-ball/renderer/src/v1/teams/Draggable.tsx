import { clsx } from '@a-type/ui';
import { useDraggable } from '@dnd-kit/core';
import { HTMLAttributes } from 'react';

export function Draggable({
  children,
  id,
  className,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  id: string;
  disabled?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      className={clsx(className)}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
