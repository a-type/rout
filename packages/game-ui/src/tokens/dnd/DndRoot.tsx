import { ReactNode } from 'react';
import { DebugView } from './DebugView';
import { useDndStore } from './dndStore';

export interface DndRootProps {
  children?: ReactNode;
}

export function DndRoot({ children }: DndRootProps) {
  const overlyRef = useDndStore((state) => state.overlayRef);
  return (
    <div data-role="dnd-root">
      <div
        data-role="dnd-overlay"
        ref={overlyRef}
        className="fixed inset-0 z-50 pointer-events-none"
      />
      {children}
      <DebugView />
    </div>
  );
}
