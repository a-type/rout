import { proxy, useSnapshot } from 'valtio';

export const updateState = proxy({
  updateAvailable: false,
  updating: false,
});

export function useIsUpdateAvailable() {
  return useSnapshot(updateState).updateAvailable;
}
