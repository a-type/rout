import { getNotificationConfig } from '@long-game/notifications';

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
        const config = getNotificationConfig(data);
        if (!config) {
          console.error('Notification click without config', data);
          return;
        }
        console.info('Turn ready push notification clicked', data);
        // open the game session
        window.history.pushState({}, '', config.link(data));
      }
    }
  });
}
