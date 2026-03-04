import { proxy } from 'valtio';

export const rendererState = proxy({
  viewingPlayerId: null as string | null,
  focusPathId: null as string | null,
});
