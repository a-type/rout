import { HTMLProps, useEffect } from 'react';
import { boundsRegistry } from './bounds.js';
import { DebugView } from './DebugView.js';
import { DndAlly } from './DndAlly.js';
import { useDndStore } from './dndStore.js';
import { useMonitorGlobalGesture } from './gestureStore.js';
import cls from './DndRoot.module.css';

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
        className={cls.overlay}
      />
      <svg
        data-role="dnd-svg-overlay"
        className={cls.svgOverlay}
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
