import { useEffect } from 'react';
import {
  updateState,
  useIsUpdateAvailable,
} from './components/updates/updateState';

export let checkForUpdate: () => Promise<void> = () => Promise.resolve();
export let skipWaiting = () => {};

export async function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (import.meta.env.DEV) return;

  try {
    const registration = await navigator.serviceWorker.register(
      new URL(
        /* webpackChunkName: "sw" */
        './sw.ts',
        import.meta.url,
      ),
    );

    console.info('Service worker registered', registration);

    checkForUpdate = registration.update.bind(registration);
    skipWaiting = () => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker updated, reloading page');
        window.location.reload();
      });

      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      updateState.updating = true;
    };

    registration.onupdatefound = () => {
      updateState.updateAvailable = true;
      console.log('Update available and ready to install');
    };

    setInterval(
      () => {
        registration.update();
        checkForUpdate = registration.update.bind(registration);
      },
      60 * 60 * 1000,
    ); // hourly
  } catch (error) {
    console.error('Service worker registration failed', error);
  }
}

export function usePollForUpdates(immediate = true, interval: number = 30_000) {
  const updateAvailable = useIsUpdateAvailable();

  useEffect(() => {
    if (immediate) {
      checkForUpdate();
    }
    const iv = setInterval(() => {
      checkForUpdate();
    }, interval);
    return () => {
      clearInterval(iv);
    };
  }, [interval]);

  return updateAvailable;
}
