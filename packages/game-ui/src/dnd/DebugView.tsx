import { useAnimationFrame } from '@a-type/ui';
import { useRef } from 'react';
import { boundsRegistry } from './bounds';
import { useDndStore } from './dndStore';
import { gesture } from './gestureStore';
import { TAGS } from './tags';

export interface DebugViewProps {}

export function DebugView({}: DebugViewProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useAnimationFrame(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 1;
    for (const [id, entry] of boundsRegistry.__entries) {
      const { bounds: region, tags } = entry;
      let color = tags.has(TAGS.DROPPABLE)
        ? '#ff0000'
        : id === useDndStore.getState().dragging
          ? '#ffff00'
          : '#0000ff';
      if (entry.measuredAt < Date.now() - 1000) {
        color += '20'; // faded color for stale entries
      } else {
        color += 'ff'; // full opacity for recent entries
      }
      ctx.strokeStyle = color;
      ctx.strokeRect(region.x, region.y, region.width, region.height);
      ctx.fillStyle = color;
      ctx.fillText(id, region.x + 5, region.y + 15);
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
