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
  toast,
  ToggleGroup,
  withClassName,
} from '@a-type/ui';
import {
  getNotificationConfigByType,
  NotificationType,
  notificationTypes,
} from '@long-game/notifications';

export interface NotificationSettingsProps {}

export function NotificationSettings({}: NotificationSettingsProps) {
  const { data: notificationSettings } = sdkHooks.useGetNotificationSettings();

  const canPush = useCanSubscribeToPush();
  const subscribedToPush = useIsSubscribedToPush();
  const [subscribeToPush, isSubscribingToPush] = useSubscribeToPush();

  return (
    <Box d="col" gap container>
      <H3>Settings</H3>
      {canPush && !subscribedToPush && (
        <Box surface color="primary" d="col" gap p border items="start">
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
      <Box d="col" gap>
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
    <Box d="row" gap items="center" justify="between">
      <Box col gap="sm">
        <div>{config.name}</div>
        <div className="text-sm italic color-gray-dark">
          {config.description}
        </div>
        {config.emailRequired && (
          <div className="text-sm italic color-gray-dark">
            Email notifications are required.
          </div>
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
          <Icon name="email" loading={loading} /> Email
        </StyledToggleItem>
      </ToggleGroup>
    </Box>
  );
}

const StyledToggleItem = withClassName(
  ToggleGroup.Item,
  'flex flex-row gap-xs items-center',
  'disabled:(!bg-gray-light !color-gray-darker)',
  'disabled:hover:!bg-gray-light',
  'disabled:focus:!bg-gray-light',
);
