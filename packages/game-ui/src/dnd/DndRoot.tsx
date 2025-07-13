import { HTMLProps, useEffect } from 'react';
import { boundsRegistry } from './bounds';
import { DebugView } from './DebugView';
import { DndAlly } from './DndAlly';
import { useDndStore } from './dndStore';
import { useMonitorGlobalGesture } from './gestureStore';

export interface DndRootProps extends HTMLProps<HTMLDivElement> {
  debug?: boolean;
}

export function DndRoot({ children, debug = true, ...rest }: DndRootProps) {
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
