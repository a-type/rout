import { isTurnReadyPushNotification } from '@long-game/common';

export function attachToPwaEvents() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) {
    // not supported
    return;
  }
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'pwa-notification-click') {
      const data = event.data.data;
      if (data) {
        if (isTurnReadyPushNotification(data)) {
          console.info('Turn ready push notification clicked', data);
          // open the game session
          window.history.pushState({}, '', `/session/${data.gameSessionId}`);
        }
      }
    }
  });
}
