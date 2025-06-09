import { useAnimationFrame } from '@a-type/ui';
import { useRef } from 'react';
import { dropRegions } from './DropRegions';
import { draggedBox } from './draggedBox';

export interface DebugViewProps {}

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

    if (draggedBox.current) {
      ctx.strokeStyle = 'blue';
      ctx.fillStyle = 'transparent';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        draggedBox.current.x,
        draggedBox.current.y,
        draggedBox.current.width,
        draggedBox.current.height,
      );
    }
  });

  return (
    <canvas
      className="fixed inset-0 w-full h-full z-1000000 pointer-events-none opacity-50"
      ref={ref}
    />
  );
}
