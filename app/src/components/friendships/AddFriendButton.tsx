import { sdkHooks } from '@/services/publicSdk';
import { Button, ButtonProps, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { useState } from 'react';

export interface AddFriendButtonProps extends ButtonProps {
  userId: PrefixedId<'u'>;
}

export function AddFriendButton({
  userId,
  children,
  ...props
}: AddFriendButtonProps) {
  const [inviteSent, setInviteSent] = useState(false);
  const sendFriendshipInvite = sdkHooks.useSendFriendshipInvite();
  const { data: otherUser } = sdkHooks.useGetUser({
    id: userId,
  });

  if (otherUser.isFriend) {
    return null;
  }

  return (
    <Button
      {...props}
      disabled={inviteSent || props.disabled}
      onClick={async () => {
        await sendFriendshipInvite.mutateAsync({ userId });
        setInviteSent(true);
      }}
    >
      {children || (
        <>
          <Icon name="add_person" />
          Add friend
        </>
      )}
    </Button>
  );
}
