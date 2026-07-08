import { sdkHooks } from '@/services/publicSdk';
import {
  useCanSubscribeToPush,
  useIsSubscribedToPush,
  useSubscribeToPush,
} from '@/services/push';
import {
  Box,
  Button,
  H3,
  Icon,
  Text,
  toast,
  ToggleGroup,
  withClassName,
} from '@a-type/ui';
import {
  getNotificationConfigByType,
  NotificationType,
  notificationTypes,
} from '@long-game/notifications';
import cls from './NotificationSettings.module.css';

export interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const { data: notificationSettings } = sdkHooks.useGetNotificationSettings();

  const canPush = useCanSubscribeToPush();
  const subscribedToPush = useIsSubscribedToPush();
  const [subscribeToPush, isSubscribingToPush] = useSubscribeToPush();

  return (
    <Box col gap container>
      <H3>Settings</H3>
      {canPush && !subscribedToPush && (
        <Box surface color="primary" col gap p border items="start">
          <div>
            <strong>Never miss a turn!</strong> Turn on notifications on this
            device.
          </div>
          <Button
            loading={isSubscribingToPush}
            emphasis="primary"
            onClick={() => subscribeToPush()}
          >
            Enable Push Notifications
          </Button>
        </Box>
      )}
      <Box col gap>
        {notificationTypes.map((key) => {
          return (
            <NotificationSettingsRow
              key={key}
              notificationType={key}
              notificationSettings={notificationSettings}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function NotificationSettingsRow({
  notificationType,
  notificationSettings,
}: {
  notificationType: NotificationType;
  notificationSettings: Record<
    NotificationType,
    { push: boolean; email: boolean }
  >;
}) {
  const config = getNotificationConfigByType(notificationType as any);
  const canPush = useCanSubscribeToPush();
  const subscribedToPush = useIsSubscribedToPush();
  const [subscribeToPush, subscribingToPush] = useSubscribeToPush();

  const ensurePushEnabled = async () => {
    if (subscribedToPush) return;
    if (canPush) {
      const result = await subscribeToPush();
      if (!result) {
        alert(
          `You rejected push notifications, or something went wrong. Can't subscribe.`,
        );
      }
    } else {
      toast.error('Push notifications are not supported on this device');
    }
  };

  const updateNotificationSettings = sdkHooks.useUpdateNotificationSettings();

  const value = [] as string[];
  if (
    notificationSettings[notificationType]?.push &&
    canPush &&
    subscribedToPush
  )
    value.push('push');
  if (notificationSettings[notificationType]?.email || config.emailRequired)
    value.push('email');

  const key = notificationType as keyof typeof notificationSettings;

  const loading = subscribingToPush || updateNotificationSettings.isPending;

  return (
    <Box gap items="center" justify="between">
      <Box col gap="sm">
        <div>{config.name}</div>
        <Text emphasis="ambient" italic dim>
          {config.description}
        </Text>
        {config.emailRequired && (
          <Text emphasis="ambient" italic dim>
            Email notifications are required.
          </Text>
        )}
      </Box>
      <ToggleGroup
        multiple
        onValueChange={async (values: string[]) => {
          const asSettings = {
            push: values.includes('push'),
            email: values.includes('email'),
          };
          if (asSettings.push) {
            await ensurePushEnabled();
          }
          await updateNotificationSettings.mutateAsync({
            ...notificationSettings,
            [key]: asSettings,
          });
        }}
        value={value}
      >
        <StyledToggleItem value="push" disabled={!canPush}>
          <Icon name={canPush ? 'phone' : 'x'} loading={loading} /> Push
        </StyledToggleItem>
        <StyledToggleItem value="email" disabled={config.emailRequired}>
          <Icon
            name={config.emailRequired ? 'lock' : 'email'}
            loading={loading}
          />{' '}
          Email
        </StyledToggleItem>
      </ToggleGroup>
    </Box>
  );
}

const StyledToggleItem = withClassName(ToggleGroup.Item, cls.toggleItem);
