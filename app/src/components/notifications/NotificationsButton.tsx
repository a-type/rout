import { withOnlyLoggedIn } from '@/hocs/withOnlyLoggedIn.js';
import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  ButtonProps,
  clsx,
  H2,
  Heading,
  Icon,
  Popover,
  PopoverArrow,
  ScrollArea,
  Text,
} from '@a-type/ui';
import { Notification } from '@long-game/game-client';
import { withSuspense } from '@long-game/game-ui';
import { getNotificationConfig } from '@long-game/notifications';
import { useNavigate } from '@verdant-web/react-router';
import { ReactElement, Suspense, useState } from 'react';
import { NotificationSettings } from './NotificationSettings.js';
import cls from './NotificationsButton.module.css';

export interface NotificationsButtonProps
  extends Omit<ButtonProps, 'children'> {
  children?: (details: { hasUnread: boolean }) => ReactElement;
}

export const NotificationsButton = withSuspense(
  withOnlyLoggedIn(function NotificationsButton({
    className,
    children,
    ...rest
  }: NotificationsButtonProps) {
    const [open, setOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
      sdkHooks.useGetNotifications({}, { refetchOnWindowFocus: true });
    const { results: notifications } = data || { results: [] };
    const hasUnread = notifications?.some((n) => !n.readAt);
    const markAllRead = sdkHooks.useMarkAllNotificationsAsRead();

    return (
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            markAllRead.mutate(undefined);
          }
          setOpen(isOpen);
        }}
      >
        <Popover.Trigger
          className={className}
          render={
            children ? (
              children({ hasUnread })
            ) : (
              <Button
                color="accent"
                emphasis={hasUnread ? 'primary' : 'ghost'}
                {...rest}
              >
                <Icon name="bell" />
              </Button>
            )
          }
        />
        <Popover.Content sticky className={cls.content}>
          <PopoverArrow />
          <Box gap items="center" justify="between" className={cls.contentMain}>
            <H2>Notifications</H2>
            <Box gap items="center">
              {!showSettings && (
                <Button
                  emphasis="ghost"
                  onClick={() => markAllRead.mutate(undefined)}
                >
                  <Icon
                    name="check"
                    style={{ position: 'relative', left: -3 }}
                  />
                  <Icon
                    name="check"
                    style={{ position: 'absolute', left: 13 }}
                  />
                </Button>
              )}
              <Button
                emphasis="ghost"
                onClick={() => {
                  setShowSettings((prev) => !prev);
                }}
              >
                <Icon name={showSettings ? 'x' : 'gear'} />
              </Button>
            </Box>
          </Box>
          <ScrollArea className={cls.scrollArea}>
            {showSettings ? (
              <Suspense>
                <NotificationSettings />
              </Suspense>
            ) : (
              <>
                {notifications?.length ? (
                  <>
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => setOpen(false)}
                      />
                    ))}
                    {hasNextPage && (
                      <Button
                        emphasis="ghost"
                        onClick={() => fetchNextPage()}
                        loading={isFetchingNextPage}
                        className="m-auto mt-lg"
                      >
                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                      </Button>
                    )}
                  </>
                ) : (
                  <Box full col layout="center center" grow dim>
                    <Icon name="bell" size={80} />
                    <span>Nothing to see here!</span>
                  </Box>
                )}
              </>
            )}
          </ScrollArea>
        </Popover.Content>
      </Popover>
    );
  }),
);

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  const config = getNotificationConfig(notification.data);

  const markRead = sdkHooks.useMarkNotificationAsRead();
  const deleteSelf = sdkHooks.useDeleteNotification();

  if (!config) {
    console.error('Notification click without config', notification);
    return null;
  }

  return (
    <Box
      key={notification.id}
      gap
      surface={notification.readAt ? false : 'ambient'}
      items="center"
      p="md"
      className="@mode-dense"
    >
      <Button
        emphasis="ghost"
        className={cls.markRead}
        onClick={() => {
          if (!notification.readAt) {
            markRead.mutate({ id: notification.id, read: true });
          }
          navigate(config.link(notification.data));
          onClick?.();
        }}
      >
        <Box col gap="sm">
          <Heading
            emphasis="ambient"
            bold={!notification.readAt}
            className={clsx('@mode-denser')}
          >
            {config.title(notification.data, 'email')}
          </Heading>
          <Text emphasis="ambient">
            {config.text(notification.data, 'email')}
          </Text>
        </Box>
      </Button>
      {!notification.readAt && (
        <Button
          emphasis="ghost"
          onClick={() => {
            markRead.mutate({ id: notification.id, read: true });
          }}
        >
          <Icon name="check" />
        </Button>
      )}
      <Button
        color="attention"
        emphasis="ghost"
        style={{ flexShrink: 0 }}
        onClick={() => deleteSelf.mutate({ id: notification.id })}
      >
        <Icon name="x" />
      </Button>
      {!notification.readAt && <div className={cls.pip} />}
    </Box>
  );
}
