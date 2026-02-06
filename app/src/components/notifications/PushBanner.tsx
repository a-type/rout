import { sdkHooks } from '@/services/publicSdk';
import { useCanSubscribeToPush, useSubscribeToPush } from '@/services/push';
import { Box, Button, H3, Icon, withProps } from '@a-type/ui';
import { useLocalStorage } from '@long-game/game-client';
import { useState } from 'react';
import { NotificationSettings } from './NotificationSettings';

export interface PushBannerProps {}

export function PushBanner({}: PushBannerProps) {
  const canPush = useCanSubscribeToPush();
  const [subscribe, isSubscribed] = useSubscribeToPush();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage(
    'push-banner-dismissed',
    false,
    false,
  );
  const [wasSubscribed, setWasSubscribed] = useState(false);
  const updateNotificationSettings = sdkHooks.useUpdateNotificationSettings();
  const { data } = sdkHooks.useGetMe();

  if (!canPush || isSubscribed || dismissed || !data) {
    return null;
  }

  return (
    <Banner>
      {wasSubscribed ? (
        <>
          <H3>Notification Settings</H3>
          <NotificationSettings />
          <Box justify="end">
            <Button onClick={() => setDismissed(true)}>Done</Button>
          </Box>
        </>
      ) : (
        <>
          <H3>Enable Push Notifications</H3>
          <p>
            Notifications tell you when it's your turn and keep the game going.
          </p>
          <Box gap full="width" justify="between" items="center">
            <Button emphasis="ghost" onClick={() => setDismissed(true)}>
              <Icon name="x" />
            </Button>
            <Button
              loading={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await subscribe();
                  // set turn ready to push immediately.
                  await updateNotificationSettings.mutateAsync({
                    'turn-ready': {
                      push: true,
                      email: false,
                    },
                  });
                  setWasSubscribed(true);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Enable Notifications
            </Button>
          </Box>
        </>
      )}
    </Banner>
  );
}

const Banner = withProps(Box, {
  color: 'primary',
  surface: true,
  elevated: 'xl',
  col: true,
  gap: true,
  p: true,
  className: 'fixed top-md left-1/2 w-95vw max-w-600px -translate-x-1/2 z-50',
});
