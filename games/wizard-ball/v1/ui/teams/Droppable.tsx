import { clsx } from '@a-type/ui';
import { useDroppable } from '@dnd-kit/core';
import { HTMLAttributes } from 'react';

export function Droppable({
  className,
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={clsx(className, isOver ? 'bg-white rounded' : '')}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
}
