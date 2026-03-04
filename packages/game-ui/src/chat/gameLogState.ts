import { proxy } from 'valtio';

/**
 * Available for use in games, not just main UI.
 * Controls main chat dialog state.
 */
export const gameLogState = proxy({
  focusChat: false,
  open: false,
});
