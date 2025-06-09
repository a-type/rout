import { useMotionValue } from 'motion/react';
import { useEffect } from 'react';
import { useDndStore } from './dndStore';

export function useDraggedObjectMotionValues() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // subscribe to dragging state
  useEffect(() => {
    return useDndStore.subscribe(
      (store) => store.dragGesture,
      (gesture) => {
        if (!gesture) {
          return;
        }
        x.set(gesture.x);
        y.set(gesture.y);
      },
      { fireImmediately: true },
    );
  }, [x, y]);

  return { x, y, position: 'absolute' as const };
}
