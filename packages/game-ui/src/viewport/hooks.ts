import { useEffect, useState } from 'react';
import { useViewport } from './ViewportContext.js';

export function useZoom(config: { instant?: boolean } = {}) {
  const viewport = useViewport();
  const [zoom, setZoom] = useState(viewport.zoom);
  useEffect(() => {
    return viewport.subscribe(
      config.instant ? 'zoomChanged' : 'zoomSettled',
      setZoom,
    );
  }, [viewport]);
  return [zoom, viewport.zoom] as const;
}

export function usePan(config: { instant?: boolean } = {}) {
  const viewport = useViewport();
  const [pan, setPan] = useState(viewport.center);
  useEffect(() => {
    return viewport.subscribe(
      config.instant ? 'centerChanged' : 'centerSettled',
      setPan,
    );
  }, [viewport]);
  return [pan, viewport.pan] as const;
}
