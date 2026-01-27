import { withOnlyLoggedIn } from '@/hocs/withOnlyLoggedIn.js';
import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  ButtonProps,
  Dialog,
  H2,
  H5,
  Icon,
  Popover,
  PopoverArrow,
  ScrollArea,
} from '@a-type/ui';
import { Notification } from '@long-game/game-client';
import { useMediaQuery, withSuspense } from '@long-game/game-ui';
import { getNotificationConfig } from '@long-game/notifications';
import { useNavigate } from '@verdant-web/react-router';
import { ReactElement, Suspense, useState } from 'react';
import { NotificationSettings } from './NotificationSettings.js';
import { useAutoReadNotifications } from './useAutoReadNotifications.js';

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

    const isMobile = useMediaQuery('(max-width: 768px)');
    const PopoverImpl = isMobile ? Dialog : Popover;

    const [showRead, setShowRead] = useState(false);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
      sdkHooks.useGetNotifications(
        { status: showRead ? undefined : 'unread' },
        { refetchOnWindowFocus: true },
      );
    const { results: notifications } = data || { results: [] };
    const hasUnread = notifications?.some((n) => !n.readAt);
    const markAllRead = sdkHooks.useMarkAllNotificationsAsRead();

    useAutoReadNotifications(notifications);

    return (
      <PopoverImpl open={open} onOpenChange={setOpen}>
        <PopoverImpl.Trigger
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
        <PopoverImpl.Content className="min-h-500px sm:w-400px sm:p-md">
          {!isMobile && <PopoverArrow />}
          <Box gap items="center" justify="between" className="mb-md">
            {isMobile ? (
              <Dialog.Title className="!m-0 text-xl">
                Notifications
              </Dialog.Title>
            ) : (
              <H2>Notifications</H2>
            )}
            <Box gap items="center">
              {!showSettings && (
                <Button
                  emphasis="ghost"
                  onClick={() => markAllRead.mutate(undefined)}
                >
                  <Icon name="check" className="relative -left-3px" />
                  <Icon name="check" className="absolute left-13px" />
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
          {showSettings ? (
            <Suspense>
              <NotificationSettings />
            </Suspense>
          ) : (
            <>
              {notifications?.length ? (
                <ScrollArea className="max-h-800px flex-[1-0-auto]">
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
                </ScrollArea>
              ) : (
                <Box
                  full
                  d="col"
                  layout="center center"
                  className="color-gray-dark flex-1"
                >
                  <Icon name="bell" size={80} />
                  <span>Nothing to see here!</span>
                </Box>
              )}
              {!showRead && (
                <Box p layout="center center">
                  <Button emphasis="ghost" onClick={() => setShowRead(true)}>
                    Show Read
                  </Button>
                </Box>
              )}
            </>
          )}
          {isMobile && (
            <Dialog.Actions>
              <Dialog.Close />
            </Dialog.Actions>
          )}
        </PopoverImpl.Content>
      </PopoverImpl>
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
      surface={notification.readAt ? false : 'white'}
      items="center"
    >
      <Button
        emphasis="ghost"
        className="flex-1 font-normal items-start text-start p-sm"
        onClick={() => {
          if (!notification.readAt) {
            markRead.mutate({ id: notification.id, read: true });
          }
          navigate(config.link(notification.data));
          onClick?.();
        }}
      >
        <Box d="col" gap="sm">
          <H5 className={notification.readAt ? 'font-normal' : ''}>
            {config.title(notification.data, 'email')}
          </H5>
          <div className="text-xs">
            {config.text(notification.data, 'email')}
          </div>
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
        className="flex-shrink-0"
        onClick={() => deleteSelf.mutate({ id: notification.id })}
      >
        <Icon name="x" />
      </Button>
      {!notification.readAt && (
        <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-accent-dark border-wash border-solid" />
      )}
    </Box>
  );
}
