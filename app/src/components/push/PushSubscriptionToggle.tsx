import { Button, ButtonProps, Dialog, Icon } from '@a-type/ui';
import { useState } from 'react';
import {
  useCanSubscribeToPush,
  useIsSubscribedToPush,
  useSubscribeToPush,
  useUnsubscribeFromPush,
} from './hooks.js';

export interface PushSubscriptionToggleProps extends ButtonProps {
  showWhenEnabled?: boolean;
}

export function PushSubscriptionToggle({
  showWhenEnabled,
  children,
  ...rest
}: PushSubscriptionToggleProps) {
  const subscribed = useIsSubscribedToPush();
  const [subscribe, isSubscribing] = useSubscribeToPush();
  const [unsubscribe, isUnsubscribing] = useUnsubscribeFromPush();
  const [open, setOpen] = useState(false);
  const canSubscribe = useCanSubscribeToPush();

  if (subscribed !== false && !showWhenEnabled) {
    return null;
  }

  if (!canSubscribe && !subscribed) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          toggled={!!subscribed}
          toggleMode="state-only"
          size="icon"
          color={subscribed ? 'ghost' : 'contrast'}
          {...rest}
        >
          <Icon name={subscribed ? 'bell' : 'bell'} />
          {children}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        {subscribed ? (
          <>
            <Dialog.Title>Disable notifications?</Dialog.Title>
            <Dialog.Description>
              Are you sure? You won't be alerted on this device when it's your
              turn to play.
            </Dialog.Description>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                color="destructive"
                onClick={unsubscribe}
                loading={isUnsubscribing}
              >
                Yes, disable
              </Button>
            </Dialog.Actions>
          </>
        ) : (
          <>
            <Dialog.Title>Never miss your turn</Dialog.Title>
            <Dialog.Description>
              Enable push notifications on this device and we'll ping you when
              it's your turn to play. Keep the game going!
            </Dialog.Description>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                color="primary"
                onClick={subscribe}
                loading={isSubscribing}
              >
                Turn on
              </Button>
            </Dialog.Actions>
          </>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
