/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { getNotificationConfig } from '@long-game/notifications';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

// precache all files in the build
precacheAndRoute(self.__WB_MANIFEST);

// default cached index route
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

// cache all images - may include non-build images, such as those
// bundled in games
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  }),
);

self.addEventListener('push', (event) => {
  if (event.data) {
    const pushData = event.data.json();
    if (!pushData.type) {
      console.error('Push notification without type', pushData);
      return;
    }
    const config = getNotificationConfig(pushData);
    if (!config) {
      console.error('Push notification without config', pushData);
      return;
    }

    // check if client is active and viewing the page already before showing a toast
    event.waitUntil(
      (async function () {
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: 'window',
        });
        const client = allClients.find((c) => 'focus' in c);
        if (client) {
          client.focus();
        } else {
          console.info(config.type, 'push notification received', pushData);
          self.registration.showNotification(config.title(pushData, 'push'), {
            body: config.text(pushData, 'push'),
            data: pushData,
            tag: `turn-${pushData.gameSessionId}`,
            icon: '/icons/android/android-launchericon-192-192.png',
            // TODO: monochrome badge
          });
        }
      })(),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  if (data) {
    event.waitUntil(
      (async function () {
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
        });
        let client = allClients.find(
          (c) => c.url === '/' && 'focus' in c,
        ) as WindowClient | null;
        if (client) {
          client.postMessage({
            type: 'pwa-notification-click',
            data,
          });
          return client.focus();
        }
        client = await self.clients.openWindow('/');
        client?.postMessage({
          type: 'pwa-notification-click',
          data,
        });
      })(),
    );
  }
});
