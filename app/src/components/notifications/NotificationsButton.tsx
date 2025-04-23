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
import { useMediaQuery } from '@long-game/game-ui';
import { getNotificationConfig } from '@long-game/notifications';
import { useNavigate } from '@verdant-web/react-router';
import { ReactNode, useState } from 'react';
import { NotificationSettings } from './NotificationSettings';

export interface NotificationsButtonProps
  extends Omit<ButtonProps, 'children'> {
  children?: (details: { hasUnread: boolean }) => ReactNode;
}

export function NotificationsButton({
  className,
  children,
  ...rest
}: NotificationsButtonProps) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const PopoverImpl = isMobile ? Dialog : Popover;

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    sdkHooks.useGetNotifications();
  const { results: notifications } = data || { results: [] };
  const hasUnread = notifications?.some((n) => !n.readAt);

  return (
    <PopoverImpl open={open} onOpenChange={setOpen}>
      <PopoverImpl.Trigger asChild className={className}>
        {children ? (
          children({ hasUnread })
        ) : (
          <Button
            size="icon"
            color={hasUnread ? 'contrast' : 'ghost'}
            {...rest}
          >
            <Icon name="bell" />
          </Button>
        )}
      </PopoverImpl.Trigger>
      <PopoverImpl.Content className="min-h-500px sm:w-400px">
        {!isMobile && <PopoverArrow />}
        <Box gap items="center" justify="between" className="mb-md">
          {isMobile ? (
            <Dialog.Title className="!m-0 text-xl">Notifications</Dialog.Title>
          ) : (
            <H2>Notifications</H2>
          )}
          <Button
            color="ghost"
            size="icon"
            onClick={() => {
              setShowSettings((prev) => !prev);
            }}
          >
            <Icon name={showSettings ? 'x' : 'gear'} />
          </Button>
        </Box>
        {showSettings ? (
          <NotificationSettings />
        ) : (
          <>
            {notifications?.length ? (
              <ScrollArea className="max-h-800px flex-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => setOpen(false)}
                  />
                ))}
                {hasNextPage && (
                  <Button
                    color="ghost"
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
                className="text-gray-dark flex-1"
              >
                <Icon name="bell" size={80} />
                <span>Nothing to see here!</span>
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
}

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
      surface={notification.readAt ? 'default' : 'wash'}
      items="center"
    >
      <Button
        color="ghost"
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
      <Button color="ghostDestructive" size="icon" className="flex-shrink-0">
        <Icon name="x" />
      </Button>
      {!notification.readAt && (
        <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-accent-dark border-wash border-solid" />
      )}
    </Box>
  );
}
