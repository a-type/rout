import { ReactNode } from 'react';
import { useDndStore } from './dndStore';

export interface DndRootProps {
  children?: ReactNode;
}

export function DndRoot({ children }: DndRootProps) {
  const overlayRef = useDndStore((state) => state.overlayRef);
  return (
    <div data-role="dnd-root">
      <div
        data-role="dnd-overlay"
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-none"
      />
      {children}
      {/* <DebugView /> */}
    </div>
  );
}
