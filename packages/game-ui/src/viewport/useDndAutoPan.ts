import { useState } from 'react';
import { useGesture } from '../dnd/gestureStore.js';
import { AutoPan } from './AutoPan.js';
import { ViewportState } from './ViewportState.js';

export function useDndAutoPan(viewport: ViewportState) {
  const autoPan = useState(() => new AutoPan(viewport))[0];
  useGesture({
    onClaim: (_, gesture) => {
      autoPan.start(gesture.currentRaw);
    },
    onMove: (gesture) => autoPan.update(gesture.currentRaw),
    onCancel: () => autoPan.stop(),
    onEnd: () => autoPan.stop(),
  });
}
