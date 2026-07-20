import { router } from '@/router';
import { sdkHooks } from '@/services/publicSdk';
import { Notification } from '@long-game/game-client';
import { getNotificationConfig } from '@long-game/notifications';
import { useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Marks notifications as read if the user is already looking at the thing.
 */
export function useAutoReadNotifications(notifications: Notification[]) {
  const location = useSyncExternalStore(
    (cb) => router.subscribe('onBeforeNavigate', cb),
    () => router.state.location.pathname,
  );
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
        continue;
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
