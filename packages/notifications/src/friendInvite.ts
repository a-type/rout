import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface FriendInviteNotification {
  type: 'friend-invite';
  id: PrefixedId<'no'>;
  inviterName: string;
  invitationId: PrefixedId<'fi'>;
}

export const friendInviteNotification: NotificationConfig<FriendInviteNotification> =
  {
    type: 'friend-invite',
    text(data, context) {
      return `${data.inviterName} sent you a friend invite.${
        context === 'push' ? ' Tap to respond!' : ''
      }`;
    },
    title() {
      return `New friend invite!`;
    },
    link(data) {
      return '/friends';
    },
  };
