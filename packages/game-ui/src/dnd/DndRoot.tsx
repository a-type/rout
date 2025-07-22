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
  const overlayRef = useDndStore((state) => state.overlayRef);
  useMonitorGlobalGesture();
  useEffect(() => boundsRegistry.setup(), []);

  return (
    <div data-role="dnd-root" {...rest}>
      <div
        data-role="dnd-overlay"
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      />
      {children}
      {debug && <DebugView />}
      <DndAlly />
    </div>
  );
}
