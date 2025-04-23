import { sdkHooks } from '@/services/publicSdk';
import {
  useCanSubscribeToPush,
  useIsSubscribedToPush,
  useSubscribeToPush,
} from '@/services/push';
import { Box, Button, H3, Switch } from '@a-type/ui';
import { sentenceCase } from 'change-case';

export interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const { data: notificationSettings } = sdkHooks.useGetNotificationSettings();
  const updateNotificationSettings = sdkHooks.useUpdateNotificationSettings();

  const updateOneSettingFactory = (key: string) => {
    return async (transport: 'email' | 'push', value: boolean) => {
      await updateNotificationSettings.mutateAsync({
        ...notificationSettings,
        [key]: {
          ...notificationSettings[key],
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
        {Object.entries(notificationSettings)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, value]) => {
            const updateOneSetting = updateOneSettingFactory(key);
            return (
              <NotificationSettingsRow
                key={key}
                label={key}
                value={value}
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
    if (!canPush) {
      const result = await subscribeToPush();
      if (!result) {
        alert(
          `Looks like you cancelled or something went wrong. Can't subscribe to push notifications.`,
        );
        return;
      } else {
        await update('push', checked);
      }
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
          <Switch
            checked={value.push && subscribedToPush}
            onCheckedChange={togglePush}
            disabled={isSubscribingToPush || !canPush}
          />
          <span className="text-xs">Push</span>
        </Box>
        <Box d="col" gap="sm" layout="center center">
          <Switch checked={value.email} onCheckedChange={toggleEmail} />
          <span className="text-xs">Email</span>
        </Box>
      </Box>
    </Box>
  );
}
