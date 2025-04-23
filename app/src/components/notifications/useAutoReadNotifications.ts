import { sdkHooks } from '@/services/publicSdk';
import { Notification } from '@long-game/game-client';
import { getNotificationConfig } from '@long-game/notifications';
import { useOnLocationChange } from '@verdant-web/react-router';
import { useEffect, useRef, useState } from 'react';

/**
 * Marks notifications as read if the user is already looking at the thing.
 */
export function useAutoReadNotifications(notifications: Notification[]) {
  const [location, setLocation] = useState(window.location.pathname);
  useOnLocationChange((loc) => setLocation(loc.pathname));
  const markRead = sdkHooks.useMarkNotificationAsRead();

  const lastRan = useRef(0);
  useEffect(() => {
    // let's not overdo it.
    if (Date.now() - lastRan.current < 5000) {
      return;
    }
    lastRan.current = Date.now();

    for (const notification of notifications) {
      if (notification.readAt) {
        return;
      }

      const config = getNotificationConfig(notification.data);
      const path = config?.link(notification.data);
      if (path && location.startsWith(path)) {
        // mark as read
        markRead.mutate({ id: notification.id, read: true });
      }
    }
  }, [notifications, location, markRead]);
}
