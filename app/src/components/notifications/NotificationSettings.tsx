import { sdkHooks } from '@/services/publicSdk';
import {
  useCanSubscribeToPush,
  useIsSubscribedToPush,
  useSubscribeToPush,
} from '@/services/push';
import { Box, Button, H3, Switch, toast, Tooltip } from '@a-type/ui';
import { Notification } from '@long-game/game-client';
import { notificationTypes } from '@long-game/notifications';
import { sentenceCase } from 'change-case';

export interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const { data: notificationSettings } = sdkHooks.useGetNotificationSettings();
  const updateNotificationSettings = sdkHooks.useUpdateNotificationSettings();

  const updateOneSettingFactory = (key: Notification['data']['type']) => {
    return async (transport: 'email' | 'push', value: boolean) => {
      await updateNotificationSettings.mutateAsync({
        ...notificationSettings,
        [key]: {
          push: false,
          email: false,
          ...(notificationSettings[key] as
            | { email: boolean; push: boolean }
            | undefined),
          [transport]: value,
        },
      });
    };
  };

  const canPush = useCanSubscribeToPush();
  const subscribedToPush = useIsSubscribedToPush();
  const [subscribeToPush, isSubscribingToPush] = useSubscribeToPush();

  return (
    <Box d="col" gap container>
      <H3>Settings</H3>
      {canPush && !subscribedToPush && (
        <Box surface="primary" d="col" gap p>
          <div>
            <strong>Never miss a turn!</strong> Turn on notifications on this
            device.
          </div>
          <Button
            loading={isSubscribingToPush}
            color="primary"
            onClick={() => subscribeToPush()}
          >
            Enable Push Notifications
          </Button>
        </Box>
      )}
      <Box d="col" gap>
        {notificationTypes.map((key) => {
          const updateOneSetting = updateOneSettingFactory(key as any);
          return (
            <NotificationSettingsRow
              key={key}
              label={key}
              value={notificationSettings[key] ?? { push: false, email: false }}
              update={updateOneSetting}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function NotificationSettingsRow({
  label,
  value,
  update,
}: {
  label: string;
  value: { email: boolean; push: boolean };
  update: (transport: 'email' | 'push', value: boolean) => Promise<void>;
}) {
  const canPush = useCanSubscribeToPush();
  const subscribedToPush = useIsSubscribedToPush();
  const [subscribeToPush, isSubscribingToPush] = useSubscribeToPush();

  const togglePush = async (checked: boolean) => {
    if (canPush) {
      const result = await subscribeToPush();
      if (!result) {
        alert(
          `Looks like you cancelled or something went wrong. Can't subscribe to push notifications.`,
        );
        return;
      } else {
        await update('push', checked);
      }
    } else {
      toast.error('Push notifications are not supported on this device');
    }
  };
  const toggleEmail = async () => {
    await update('email', !value.email);
  };

  return (
    <Box d="row" gap items="center" justify="between">
      <Box>{sentenceCase(label)}</Box>
      <Box items="center" gap>
        <Box d="col" gap="sm" layout="center center">
          <Tooltip
            disabled={!!canPush}
            content="Push notifications are not supported on this device"
            color="contrast"
          >
            <Switch
              checked={value.push && subscribedToPush}
              onCheckedChange={togglePush}
              disabled={isSubscribingToPush || !canPush}
              className={!canPush ? 'opacity-50' : 'cursor-pointer'}
            />
          </Tooltip>
          <span className="text-xs">Push</span>
        </Box>
        <Box d="col" gap="sm" layout="center center">
          <Switch
            checked={value.email}
            onCheckedChange={toggleEmail}
            className="cursor-pointer"
          />
          <span className="text-xs">Email</span>
        </Box>
      </Box>
    </Box>
  );
}
