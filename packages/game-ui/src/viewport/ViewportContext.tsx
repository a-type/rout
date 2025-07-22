import { createContext, use } from 'react';
import { ViewportState } from './ViewportState.js';

const ViewportContext = createContext<ViewportState | null>(null);

export const ViewportProvider = ViewportContext.Provider;
export function useViewport() {
  const viewport = use(ViewportContext);
  if (!viewport) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return viewport;
}
