import { clsx } from '@a-type/ui';
import { useDraggable } from '@dnd-kit/core';
import { Card as CardType } from '@long-game/game-gudnak-definition/v1';

export type DragData = {
  instanceId: string;
  cardInfo: CardType;
};

export function Draggable({
  className,
  data,
  style,
  children,
}: {
  className?: string;
  data: DragData;
  style?: React.CSSProperties;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { setNodeRef, listeners, transform, attributes } = useDraggable({
    id: data.instanceId,
    data,
  });

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      className={clsx(className, 'z-40 touch-manipulation')}
      style={{ ...style, ...transformStyle }}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
