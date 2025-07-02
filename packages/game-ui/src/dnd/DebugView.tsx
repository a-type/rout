import { useAnimationFrame } from '@a-type/ui';
import { createRef, useRef } from 'react';
import { DraggableContextValue } from './Draggable';
import { dropRegions } from './DropRegions';
import { gesture } from './gestureStore';

export interface DebugViewProps {}

export const activeDragRef = createRef<DraggableContextValue>();
export const otherDragBoxRefs = new Set<DraggableContextValue>();

export function DebugView({}: DebugViewProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useAnimationFrame(() => {
    const ctx = ref.current?.getContext('2d')!;

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    for (const [id, region] of dropRegions.regions) {
      ctx.strokeRect(region.x, region.y, region.width, region.height);
      ctx.fillStyle = 'red';
      ctx.fillText(id, region.x + 5, region.y + 15);
    }

    const activeDragBox = activeDragRef.current?.box.current;
    if (activeDragBox) {
      ctx.strokeStyle = 'blue';
      ctx.fillStyle = 'transparent';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        activeDragBox.x,
        activeDragBox.y,
        activeDragBox.width,
        activeDragBox.height,
      );
    }

    for (const dragBox of otherDragBoxRefs) {
      const box = dragBox.box.current;
      if (box) {
        ctx.strokeStyle = 'green';
        ctx.fillStyle = 'transparent';
        ctx.lineWidth = 1;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      }
    }

    if (gesture.active) {
      ctx.fillStyle = 'orange';
      ctx.fillRect(gesture.currentRaw.x - 5, gesture.currentRaw.y - 5, 10, 10);
    }
  });

  return (
    <canvas
      className="fixed inset-0 w-full h-full z-1000000 pointer-events-none opacity-50"
      ref={ref}
    />
  );
}
