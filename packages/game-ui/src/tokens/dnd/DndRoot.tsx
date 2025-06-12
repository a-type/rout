import { HTMLProps } from 'react';
import { useDndStore } from './dndStore';
import { useMonitorGlobalGesture } from './gestureStore';

export interface DndRootProps extends HTMLProps<HTMLDivElement> {}

export function DndRoot({ children, ...rest }: DndRootProps) {
  const overlayRef = useDndStore((state) => state.overlayRef);
  useMonitorGlobalGesture();
  return (
    <div data-role="dnd-root" {...rest}>
      <div
        data-role="dnd-overlay"
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      />
      {children}
      {/* <DebugView /> */}
    </div>
  );
}
