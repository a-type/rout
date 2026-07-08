import { HTMLProps, useEffect } from 'react';
import { boundsRegistry } from './bounds.js';
import { DebugView } from './DebugView.js';
import { DndAlly } from './DndAlly.js';
import { useDndStore } from './dndStore.js';
import { useMonitorGlobalGesture } from './gestureStore.js';

export interface DndRootProps extends HTMLProps<HTMLDivElement> {
  debug?: boolean;
}

export function DndRoot({ children, debug, ...rest }: DndRootProps) {
  const overlayRef = useDndStore((state) => state.domOverlayRef);
  const svgOverlayRef = useDndStore((state) => state.svgOverlayRef);
  useMonitorGlobalGesture();
  useEffect(() => boundsRegistry.setup(), []);

  return (
    <div data-role="dnd-root" {...rest}>
      <div
        data-role="dnd-overlay"
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          pointerEvents: 'none',
          overflow: 'clip',
        }}
      />
      <svg
        data-role="dnd-svg-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          pointerEvents: 'none',
          overflow: 'clip',
        }}
        ref={svgOverlayRef}
      >
        <defs>
          <clipPath id="dnd-clip-path">
            <rect width="100%" height="100%" />
          </clipPath>
        </defs>
        <g clipPath="url(#dnd-clip-path)" />
      </svg>
      {children}
      {debug && <DebugView />}
      <DndAlly />
    </div>
  );
}
