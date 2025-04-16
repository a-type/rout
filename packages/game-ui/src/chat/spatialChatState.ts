import { proxy } from 'valtio';

export const spatialChatState = proxy({
  revealedSpatialChatId: null as string | null,
});
